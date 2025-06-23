import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import { TextUtils } from '../../../../shared/utils/TextUtils';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import * as express from 'express';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { User } from '../../domain/user';
import { UserEmail } from '../../domain/userEmail';
import { UserName } from '../../domain/userName';
import { UserPassword } from '../../domain/userPassword';
import { IUserRepo } from '../../repos/userRepo';
import { UseCase } from '../../../../shared/core/UseCase';
import { TenantId } from '../../domain/tenantId';
import { UniqueEntityID } from '../../../../shared/domain/UniqueEntityID';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface CreateTenantUserDTO {
  username: string;
  email: string;
  phone: string;
  password: string;
  name: string;
  tenantId: string;
  isAdminUser?: boolean;
}

// Error Classes
export namespace CreateTenantUserErrors {
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
export type CreateTenantUserResponse = Either<
  | CreateTenantUserErrors.EmailAlreadyExistsError
  | CreateTenantUserErrors.UsernameTakenError
  | AppError.UnexpectedError
  | Result<any>,
  Result<void>
>;

// Use Case
export class CreateTenantUserUseCase implements UseCase<CreateTenantUserDTO, Promise<CreateTenantUserResponse>> {
  private userRepo: IUserRepo;

  constructor(userRepo: IUserRepo) {
    this.userRepo = userRepo;
  }

  async execute(request: CreateTenantUserDTO): Promise<CreateTenantUserResponse> {
    const emailOrError = UserEmail.create(request.email);
    const passwordOrError = UserPassword.create({ value: request.password });
    const usernameOrError = UserName.create({ name: request.username });

    const dtoResult = Result.combine([
      emailOrError,
      passwordOrError,
      usernameOrError
    ]);

    if (dtoResult.isFailure) {
      return left(Result.fail<void>(dtoResult.getErrorValue())) as CreateTenantUserResponse;
    }

    const email: UserEmail = emailOrError.getValue();
    const password: UserPassword = passwordOrError.getValue();
    const username: UserName = usernameOrError.getValue();
    const name = request.name;
    const phone = request.phone;
    const tenantId = request.tenantId;
    
    if (!tenantId) return left(Result.fail<void>('TenantId is required'));

    try {
      const userAlreadyExists = await this.userRepo.exists(email);
      if (userAlreadyExists) {
        return left(
          new CreateTenantUserErrors.EmailAlreadyExistsError(email.value)
        ) as CreateTenantUserResponse;
      }

      try {
        const alreadyCreatedUserByUserName = await this.userRepo.getUserByUserName(username);
        const userNameTaken = !!alreadyCreatedUserByUserName === true;

        if (userNameTaken) {
          return left(
            new CreateTenantUserErrors.UsernameTakenError(username.value)
          ) as CreateTenantUserResponse;
        }
      } catch (err) {}

      const userOrError: Result<User> = User.createLoginUser({
        email,
        password,
        username,
        name,
        phone,
        isAdminUser: request.isAdminUser,
        tenantId: TenantId.create(new UniqueEntityID(request.tenantId)).getValue()
      });

      if (userOrError.isFailure) {
        return left(
          Result.fail<User>(userOrError.getErrorValue().toString())
        ) as CreateTenantUserResponse;
      }

      const user: User = userOrError.getValue();
      await this.userRepo.save(user);

      return right(Result.ok<void>());
    } catch (err) {
      return left(new AppError.UnexpectedError(err)) as CreateTenantUserResponse;
    }
  }
}

// Controller
export class CreateTenantUserController extends BaseController {
  private useCase: CreateTenantUserUseCase;

  constructor(useCase: CreateTenantUserUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    let dto: CreateTenantUserDTO = req.body as CreateTenantUserDTO;
    dto = {
      username: TextUtils.sanitize(dto.username),
      email: TextUtils.sanitize(dto.email),
      password: dto.password,
      phone: dto.phone,
      name: dto.name,
      tenantId: dto.tenantId,
      isAdminUser: dto.isAdminUser,
    };

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;

        switch (error.constructor) {
          case CreateTenantUserErrors.UsernameTakenError:
            return this.conflict(res, error.getErrorValue().message);
          case CreateTenantUserErrors.EmailAlreadyExistsError:
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

// Index Export
export function createTenantUserComponents(userRepo: IUserRepo) {
  const createTenantUserUseCase = new CreateTenantUserUseCase(userRepo);
  const createTenantUserController = new CreateTenantUserController(createTenantUserUseCase);

  return { createTenantUserUseCase, createTenantUserController };
}