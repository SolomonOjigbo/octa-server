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
export interface UpdateTenantUserDTO {
  userId: string;
  name?: string;
  email?: string;
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
export namespace UpdateTenantUserErrors {
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
type UpdateTenantUserResponse = Either<
  | UpdateTenantUserErrors.EmailAlreadyExistsError
  | UpdateTenantUserErrors.UsernameTakenError
  | UpdateTenantUserErrors.UserIdNotValidError
  | AppError.UnexpectedError,
  Result<User>
>;

// Use Case
export class UpdateTenantUserUseCase implements UseCase<UpdateTenantUserDTO, Promise<UpdateTenantUserResponse>> {
  private userRepo: IUserRepo;

  constructor(userRepo: IUserRepo) {
    this.userRepo = userRepo;
  }

  async execute(request: UpdateTenantUserDTO): Promise<UpdateTenantUserResponse> {
    try {
      const user = await this.userRepo.getUserByUserId(request.userId);
      if (!user) {
        return left(new UpdateTenantUserErrors.UserIdNotValidError(request.userId));
      }

      // Check for email uniqueness if email is being updated
      if (request.email && request.email !== user.email.value) {
        const emailExists = await this.userRepo.exists(UserEmail.create(request.email).getValue());
        if (emailExists) {
          return left(new UpdateTenantUserErrors.EmailAlreadyExistsError(request.email));
        }
      }

      // Check for username uniqueness if username is being updated
      if (request.username && request.username !== user.username.value) {
        const usernameExists = await this.userRepo.getUserByUserName(
          UserName.create({ name: request.username }).getValue()
        );
        if (usernameExists) {
          return left(new UpdateTenantUserErrors.UsernameTakenError(request.username));
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
        // roles: request.roles ?? user.roles, // Removed because 'roles' does not exist on User
        tenantId: user.tenantId // TenantId shouldn't be changed via this update
      };

      const userOrError = User.create(updateProps, user.userId.id);
      if (userOrError.isFailure) {
        return left(new AppError.UnexpectedError(userOrError.getErrorValue()));
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
export class UpdateTenantUserController extends BaseController {
  private useCase: UpdateTenantUserUseCase;

  constructor(useCase: UpdateTenantUserUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const dto: UpdateTenantUserDTO = req.body as UpdateTenantUserDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;
        switch (error.constructor) {
          case UpdateTenantUserErrors.UsernameTakenError:
          case UpdateTenantUserErrors.EmailAlreadyExistsError:
            return this.conflict(res, error.getErrorValue().message);
          case UpdateTenantUserErrors.UserIdNotValidError:
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
export function createUpdateTenantUserComponents(userRepo: IUserRepo) {
  const updateTenantUserUseCase = new UpdateTenantUserUseCase(userRepo);
  const updateTenantUserController = new UpdateTenantUserController(updateTenantUserUseCase);
  return { updateTenantUserUseCase, updateTenantUserController };
}