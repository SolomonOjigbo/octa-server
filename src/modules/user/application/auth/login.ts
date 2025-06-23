import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import * as express from 'express';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { IUserRepo } from '../../repos/userRepo';
import { IAuthService } from '../../services/auth.service';
import { User } from '../../domain/user';
import { UserName } from '../../domain/userName';
import { UserPassword } from '../../domain/userPassword';
import { JWTToken, RefreshToken } from '../../domain/jwt';
import { databaseService } from '../../../../shared/services';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interfaces
export interface LoginDTO {
  username: string;
  password: string;
}

export interface LoginDTOResponse {
  accessToken: JWTToken;
  refreshToken: RefreshToken;
}

// Error Classes
export namespace LoginUseCaseErrors {
  export class UserNameDoesntExistError extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Username or password incorrect.`
      } as UseCaseError);
    }
  }

  export class PasswordDoesntMatchError extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Password doesn't match.`
      } as UseCaseError);
    }
  }
}

// Response Type
type LoginResponse = Either<
  | LoginUseCaseErrors.PasswordDoesntMatchError
  | LoginUseCaseErrors.UserNameDoesntExistError
  | AppError.UnexpectedError,
  Result<LoginDTOResponse>
>;

// Use Case
export class LoginUserUseCase implements UseCase<LoginDTO, Promise<LoginResponse>> {
  private userRepo: IUserRepo;
  private authService: IAuthService;

  constructor(userRepo: IUserRepo, authService: IAuthService) {
    this.userRepo = userRepo;
    this.authService = authService;
  }

  public async execute(request: LoginDTO): Promise<LoginResponse> {
    try {
      // Validate input
      const usernameOrError = UserName.create({ name: request.username });
      const passwordOrError = UserPassword.create({ value: request.password });
      const validationResult = Result.combine([usernameOrError, passwordOrError]);

      if (validationResult.isFailure) {
        return left(Result.fail(validationResult.getErrorValue()));
      }

      const userName = usernameOrError.getValue();
      const password = passwordOrError.getValue();

      // Find user
      const user = await this.userRepo.getUserByUserName(userName);
      if (!user) {
        return left(new LoginUseCaseErrors.UserNameDoesntExistError());
      }

      // Verify password
      const passwordValid = await user.password.comparePassword(password.value);
      if (!passwordValid) {
        return left(new LoginUseCaseErrors.PasswordDoesntMatchError());
      }

      // Initialize tenant database connection
      await databaseService.getDBclient(user.tenantId.id.toString());

      // Generate tokens
      const accessToken: JWTToken = this.authService.signJWT({
        username: user.username.value,
        email: user.email.value,
        isAdminUser: user.isAdminUser,
        isSuperAdmin: user.isSuperAdmin,
        userId: user.userId.id.toString(),
        tenantId: user.tenantId.id.toString(),
      });

      const refreshToken: RefreshToken = this.authService.createRefreshToken();
      
      // Update user with tokens
      user.setAccessToken(accessToken, refreshToken);
      await this.authService.saveAuthenticatedUser(user);

      return right(
        Result.ok<LoginDTOResponse>({
          accessToken,
          refreshToken
        })
      );
    } catch (err) {
      return left(new AppError.UnexpectedError(err.toString()));
    }
  }
}

// Controller
export class LoginController extends BaseController {
  private useCase: LoginUserUseCase;

  constructor(useCase: LoginUserUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const dto: LoginDTO = req.body as LoginDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;
        switch (error.constructor) {
          case LoginUseCaseErrors.UserNameDoesntExistError:
            return this.notFound(res, error.getErrorValue().message);
          case LoginUseCaseErrors.PasswordDoesntMatchError:
            return this.unauthorized(res, error.getErrorValue().message);
          default:
            return this.fail(res, error.getErrorValue().message);
        }
      } else {
        const tokens = result.value.getValue();
        return this.ok<LoginDTOResponse>(res, tokens);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}

// Factory Function
export function createLoginComponents(userRepo: IUserRepo, authService: IAuthService) {
  const loginUseCase = new LoginUserUseCase(userRepo, authService);
  const loginController = new LoginController(loginUseCase);
  return { loginUseCase, loginController };
}