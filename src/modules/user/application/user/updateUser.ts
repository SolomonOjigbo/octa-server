import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import * as express from 'express';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { IUserRepo } from '../../repos/userRepo';
import { User } from '../../domain/user';
import { UserEmail } from '../../domain/userEmail';
import { UserName } from '../../domain/userName';
import { UserPassword } from '../../domain/userPassword';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface UpdateUserDTO {
  userId: string;
  email?: string;
  name?: string;
  phone?: string;
  tenantId?: string;
  username?: string;
  password?: string;
  isEmailVerified?: boolean;
  isAdminUser?: boolean;
  isSuperAdmin?: boolean;
  accessToken?: string;
  refreshToken?: string;
  isDeleted?: boolean;
  lastLogin?: Date;
  roles?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

// Error Classes
export namespace UpdateUserErrors {
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

  export class UserIdNotValidError extends Result<UseCaseError> {
    constructor(userId: string) {
      super(false, {
        message: `The userId ${userId} is not valid`
      } as UseCaseError);
    }
  }
}

// Response Type
type UpdateUserResponse = Either<
  | UpdateUserErrors.EmailAlreadyExistsError
  | UpdateUserErrors.UsernameTakenError
  | UpdateUserErrors.UserIdNotValidError
  | AppError.UnexpectedError,
  Result<User>
>;

// Use Case
export class UpdateUserUseCase implements UseCase<UpdateUserDTO, Promise<UpdateUserResponse>> {
  private userRepo: IUserRepo;

  constructor(userRepo: IUserRepo) {
    this.userRepo = userRepo;
  }

  async execute(request: UpdateUserDTO): Promise<UpdateUserResponse> {
    try {
      // Get existing user
      const user = await this.userRepo.getUserByUserId(request.userId);
      if (!user) {
        return left(new UpdateUserErrors.UserIdNotValidError(request.userId));
      }

      // Validate email if being updated
      if (request.email && request.email !== user.email.value) {
        const emailOrError = UserEmail.create(request.email);
        if (emailOrError.isFailure) {
          return left(Result.fail<void>(emailOrError.getErrorValue()));
        }
        const email = emailOrError.getValue();
        if (await this.userRepo.exists(email)) {
          return left(new UpdateUserErrors.EmailAlreadyExistsError(email.value));
        }
      }

      // Validate username if being updated
      if (request.username && request.username !== user.username.value) {
        const usernameOrError = UserName.create({ name: request.username });
        if (usernameOrError.isFailure) {
          return left(Result.fail<void>(usernameOrError.getErrorValue()));
        }
        const username = usernameOrError.getValue();
        if (await this.userRepo.getUserByUserName(username)) {
          return left(new UpdateUserErrors.UsernameTakenError(username.value));
        }
      }

      // Create updated user properties
      const updateProps = {
        email: request.email ? UserEmail.create(request.email).getValue() : user.email,
        password: request.password ? UserPassword.create({ value: request.password }).getValue() : user.password,
        username: request.username ? UserName.create({ name: request.username }).getValue() : user.username,
        name: request.name ?? user.name,
        phone: request.phone ?? user.phone,
        isEmailVerified: request.isEmailVerified ?? user.isEmailVerified,
        isAdminUser: request.isAdminUser ?? user.isAdminUser,
        isSuperAdmin: request.isSuperAdmin ?? user.isSuperAdmin,
        isDeleted: request.isDeleted ?? user.isDeleted,
        lastLogin: request.lastLogin ?? user.lastLogin,
        accessToken: request.accessToken ?? user.accessToken,
        refreshToken: request.refreshToken ?? user.refreshToken,
        roles: request.roles ?? user.roles,
        tenantId: user.tenantId, // TenantId shouldn't be changed via this update
        address: request.address ? request.address : user.address
      };

      // Create updated user entity
      const userOrError = User.create(updateProps, user.userId.id.toString());
      if (userOrError.isFailure) {
        return left(Result.fail<User>(userOrError.getErrorValue().toString()));
      }

      const updatedUser = userOrError.getValue();
      await this.userRepo.update(request.userId, updatedUser);

      return right(Result.ok<User>(updatedUser));
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class UpdateUserController extends BaseController {
  private useCase: UpdateUserUseCase;

  constructor(useCase: UpdateUserUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const dto: UpdateUserDTO = req.body as UpdateUserDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;
        switch (error.constructor) {
          case UpdateUserErrors.UsernameTakenError:
          case UpdateUserErrors.EmailAlreadyExistsError:
            return this.conflict(res, error.getErrorValue().message);
          case UpdateUserErrors.UserIdNotValidError:
            return this.notFound(res, error.getErrorValue().message);
          default:
            return this.fail(res, error.getErrorValue().message);
        }
      } else {
        const updatedUser = result.value.getValue();
        return this.ok(res, updatedUser);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}

// Factory Function
export function createUpdateUserComponents(userRepo: IUserRepo) {
  const updateUserUseCase = new UpdateUserUseCase(userRepo);
  const updateUserController = new UpdateUserController(updateUserUseCase);
  return { updateUserUseCase, updateUserController };
}