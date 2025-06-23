import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import * as express from 'express';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { IUserRepo } from '../../repos/userRepo';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface DeleteUserDTO {
  userId: string;
}

// Error Classes
export namespace DeleteUserErrors {
  export class UserNotFoundError extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `User not found`
      } as UseCaseError);
    }
  }
}

// Response Type
type DeleteUserResponse = Either<
  DeleteUserErrors.UserNotFoundError | 
  AppError.UnexpectedError, 
  Result<void>
>;

// Use Case
export class DeleteUserUseCase implements UseCase<DeleteUserDTO, Promise<DeleteUserResponse>> {
  private userRepo: IUserRepo;

  constructor(userRepo: IUserRepo) {
    this.userRepo = userRepo;
  }

  public async execute(request: DeleteUserDTO): Promise<DeleteUserResponse> {
    try {
      const user = await this.userRepo.getUserByUserId(request.userId);
      
      if (!user) {
        return left(new DeleteUserErrors.UserNotFoundError());
      }

      // Soft delete the user
      user.delete();
      await this.userRepo.save(user);

      return right(Result.ok<void>());
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class DeleteUserController extends BaseController {
  private useCase: DeleteUserUseCase;

  constructor(useCase: DeleteUserUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const dto: DeleteUserDTO = req.body as DeleteUserDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;
        switch (error.constructor) {
          case DeleteUserErrors.UserNotFoundError:
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
export function createDeleteUserComponents(userRepo: IUserRepo) {
  const deleteUserUseCase = new DeleteUserUseCase(userRepo);
  const deleteUserController = new DeleteUserController(deleteUserUseCase);
  return { deleteUserUseCase, deleteUserController };
}