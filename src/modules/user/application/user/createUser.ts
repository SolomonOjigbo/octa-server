import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import { TextUtils } from '../../../../shared/utils/TextUtils';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import * as express from 'express';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { IUserRepo } from '../../repos/userRepo';
import { UserEmail } from '../../domain/userEmail';
import { UserPassword } from '../../domain/userPassword';
import { UserName } from '../../domain/userName';
import { User } from '../../domain/user';
import { TenantId } from '../../domain/tenantId';
import { UniqueEntityID } from '../../../../shared/domain/UniqueEntityID';
import { Address } from '../../../../shared/domain/nexa/address';
import { DomainEvents } from '../../../../shared/domain/events/DomainEvents';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface CreateUserDTO {
  username: string;
  email: string;
  phone: string;
  password: string;
  name: string;
  tenantId: string;
  isAdminUser?: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

// Error Classes
export namespace CreateUserErrors {
  export class EmailAlreadyExistsError extends Result<UseCaseError> {
    constructor(email: string) {
      super(false, {
        message: `The email ${email} associated for this account already exists`
      } as UseCaseError);
    }
  }

  export class UsernameTakenError extends Result<UseCaseError> {
    constructor(username: string) {
      super(false, {
        message: `The username ${username} was already taken`
      } as UseCaseError);
    }
  }
}

// Response Type
type CreateUserResponse = Either<
  | CreateUserErrors.EmailAlreadyExistsError
  | CreateUserErrors.UsernameTakenError
  | AppError.UnexpectedError
  | Result<any>,
  Result<void>
>;

// Use Case
export class CreateUserUseCase implements UseCase<CreateUserDTO, Promise<CreateUserResponse>> {
  private userRepo: IUserRepo;

  constructor(userRepo: IUserRepo) {
    this.userRepo = userRepo;
  }

  async execute(request: CreateUserDTO): Promise<CreateUserResponse> {
    // Validate input fields
    const emailOrError = UserEmail.create(request.email);
    const passwordOrError = UserPassword.create({ value: request.password });
    const usernameOrError = UserName.create({ name: request.username });
      
    const dtoResult = Result.combine([emailOrError, passwordOrError, usernameOrError]);

    if (dtoResult.isFailure) {
      return left(Result.fail<void>(dtoResult.getErrorValue()));
    }

    const email = emailOrError.getValue();
    const password = passwordOrError.getValue();
    const username = usernameOrError.getValue();
    const { name, phone, tenantId } = request;

    if (!tenantId) {
      return left(Result.fail<void>("TenantId is required"));
    }

    try {
      // Check for existing email
      if (await this.userRepo.exists(email)) {
        return left(new CreateUserErrors.EmailAlreadyExistsError(email.value));
      }

      // Check for existing username
      if (await this.userRepo.getUserByUserName(username)) {
        return left(new CreateUserErrors.UsernameTakenError(username.value));
      }

      // Validate address if provided
      let address: Address | undefined;
      if (request.address) {
        const addressOrError = Address.create({
        //   street: request.address.street,
          city: request.address.city,
          state: request.address.state,
          postalCode: request.address.postalCode,
          country: request.address.country
        });
        if (addressOrError.isFailure) {
          return left(Result.fail<User>(addressOrError.getErrorValue().toString()));
        }
        address = addressOrError.getValue();
      }

      // Create user entity
      const userOrError = User.create({
        email,
        password,
        username,
        name,
        phone,
        address,
        isAdminUser: request.isAdminUser,
        tenantId: TenantId.create(new UniqueEntityID(tenantId)).getValue()
      });

      if (userOrError.isFailure) {
        return left(Result.fail<User>(userOrError.getErrorValue().toString()));
      }

      const user = userOrError.getValue();
      await this.userRepo.save(user);

      // Dispatch domain events
      DomainEvents.dispatchEventsForAggregate(new UniqueEntityID(user.userId.id.toString()));

      return right(Result.ok<void>());
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class CreateUserController extends BaseController {
  private useCase: CreateUserUseCase;

  constructor(useCase: CreateUserUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    let dto: CreateUserDTO = {
      ...req.body,
      username: TextUtils.sanitize(req.body.username),
      email: TextUtils.sanitize(req.body.email),
      password: req.body.password,
      phone: req.body.phone,
      name: req.body.name,
      tenantId: req.body.tenantId,
      isAdminUser: req.body.isAdminUser,
      address: req.body.address
    };

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;
        switch (error.constructor) {
          case CreateUserErrors.UsernameTakenError:
          case CreateUserErrors.EmailAlreadyExistsError:
            return this.conflict(res, error.getErrorValue().message);
          default:
            return this.fail(res, error.getErrorValue().message);
        }
      } else {
        return this.ok(res);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}

// Factory Function
export function createUserComponents(userRepo: IUserRepo) {
  const createUserUseCase = new CreateUserUseCase(userRepo);
  const createUserController = new CreateUserController(createUserUseCase);
  return { createUserUseCase, createUserController };
}