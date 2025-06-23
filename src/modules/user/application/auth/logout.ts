import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import * as express from 'express';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { IUserRepo } from '../../repos/userRepo';
import { IAuthService } from '../../services/auth.service';
import { User } from '../../domain/user';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface LogoutDTO {
  userId: string;
}

// Error Classes
export namespace LogoutErrors {
  export class UserNotFoundOrDeletedError extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `User not found or doesn't exist anymore.`
      } as UseCaseError);
    }
  }
}

// Response Type
type LogoutResponse = Either<
  LogoutErrors.UserNotFoundOrDeletedError | 
  AppError.UnexpectedError, 
  Result<void>
>;

// Use Case
export class LogoutUseCase implements UseCase<LogoutDTO, Promise<LogoutResponse>> {
  private userRepo: IUserRepo;
  private authService: IAuthService;

  constructor(userRepo: IUserRepo, authService: IAuthService) {
    this.userRepo = userRepo;
    this.authService = authService;
  }

  public async execute(request: LogoutDTO): Promise<LogoutResponse> {
    try {
      // Find user by ID
      const user = await this.userRepo.getUserByUserId(request.userId);
      if (!user) {
        return left(new LogoutErrors.UserNotFoundOrDeletedError());
      }

      // Remove authentication tokens
      await this.authService.deAuthenticateUser(user.username.value);

      return right(Result.ok<void>());
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class LogoutController extends BaseController {
  private useCase: LogoutUseCase;

  constructor(useCase: LogoutUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const { userId } = req.decoded;

    try {
      const result = await this.useCase.execute({ userId });

      if (result.isLeft()) {
        const error = result.value;
        switch (error.constructor) {
          case LogoutErrors.UserNotFoundOrDeletedError:
            return this.notFound(res, error.getErrorValue().message);
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
export function createLogoutComponents(userRepo: IUserRepo, authService: IAuthService) {
  const logoutUseCase = new LogoutUseCase(userRepo, authService);
  const logoutController = new LogoutController(logoutUseCase);
  return { logoutUseCase, logoutController };
}