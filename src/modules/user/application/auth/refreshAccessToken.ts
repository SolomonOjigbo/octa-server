import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import * as express from 'express';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { IAuthService } from '../../services/auth.service';
import { JWTToken, RefreshToken } from '../../domain/jwt';
import { IUserRepo } from '../../repos/userRepo';
import { User } from '../../domain/user';
import { LoginDTOResponse } from './login';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface RefreshAccessTokenDTO {
  refreshToken: RefreshToken;
}

// Error Classes
export namespace RefreshAccessTokenErrors {
  export class RefreshTokenNotFound extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Refresh token doesn't exist`
      } as UseCaseError);
    }
  }

  export class UserNotFoundOrDeletedError extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `User not found or doesn't exist anymore.`
      } as UseCaseError);
    }
  }
}

// Response Type
type RefreshAccessTokenResponse = Either<
  | RefreshAccessTokenErrors.RefreshTokenNotFound
  | RefreshAccessTokenErrors.UserNotFoundOrDeletedError
  | AppError.UnexpectedError,
  Result<JWTToken>
>;

// Use Case
export class RefreshAccessToken implements UseCase<RefreshAccessTokenDTO, Promise<RefreshAccessTokenResponse>> {
  private userRepo: IUserRepo;
  private authService: IAuthService;

  constructor(userRepo: IUserRepo, authService: IAuthService) {
    this.userRepo = userRepo;
    this.authService = authService;
  }

  public async execute(req: RefreshAccessTokenDTO): Promise<RefreshAccessTokenResponse> {
    try {
      // Validate refresh token and get username
      const username = await this.authService.getUserNameFromRefreshToken(req.refreshToken);
      if (!username) {
        return left(new RefreshAccessTokenErrors.RefreshTokenNotFound());
      }

      // Get user by username
      const user = await this.userRepo.getUserByUserName(username);
      if (!user) {
        return left(new RefreshAccessTokenErrors.UserNotFoundOrDeletedError());
      }

      // Generate new access token
      const accessToken: JWTToken = this.authService.signJWT({
        username: user.username.value,
        email: user.email.value,
        isAdminUser: user.isAdminUser,
        isSuperAdmin: user.isSuperAdmin,
        userId: user.userId.id.toString(),
        tenantId: user.tenantId.id.toString(),
      });

      // Update user tokens
      user.setAccessToken(accessToken, req.refreshToken);
      await this.authService.saveAuthenticatedUser(user);

      return right(Result.ok<JWTToken>(accessToken));
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class RefreshAccessTokenController extends BaseController {
  private useCase: RefreshAccessToken;

  constructor(useCase: RefreshAccessToken) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(req: express.Request, res: express.Response): Promise<any> {
    const dto: RefreshAccessTokenDTO = req.body as RefreshAccessTokenDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;
        switch (error.constructor) {
          case RefreshAccessTokenErrors.RefreshTokenNotFound:
          case RefreshAccessTokenErrors.UserNotFoundOrDeletedError:
            return this.notFound(res, error.getErrorValue().message);
          default:
            return this.fail(res, error.getErrorValue().message);
        }
      } else {
        const accessToken = result.value.getValue();
        return this.ok<LoginDTOResponse>(res, {
          refreshToken: dto.refreshToken,
          accessToken
        });
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}

// Factory Function
export function createRefreshTokenComponents(userRepo: IUserRepo, authService: IAuthService) {
  const refreshAccessToken = new RefreshAccessToken(userRepo, authService);
  const refreshAccessTokenController = new RefreshAccessTokenController(refreshAccessToken);
  return { refreshAccessToken, refreshAccessTokenController };
}