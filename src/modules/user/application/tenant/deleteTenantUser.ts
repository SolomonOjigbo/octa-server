import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import * as express from 'express';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { IUserRepo } from '../../repos/userRepo';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface DeleteTenantUserDTO {
  userId: string;
}

// Error Classes
export namespace DeleteTenantUserErrors {
  export class UserNotFoundError extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `User not found`
      } as UseCaseError);
    }
  }
}

// Response Type
type DeleteTenantUserResponse = Either<
  DeleteTenantUserErrors.UserNotFoundError | 
  AppError.UnexpectedError, 
  Result<void>
>;

// Use Case
export class DeleteTenantUserUseCase implements UseCase<DeleteTenantUserDTO, Promise<DeleteTenantUserResponse>> {
  private userRepo: IUserRepo;

  constructor(userRepo: IUserRepo) {
    this.userRepo = userRepo;
  }

  public async execute(request: DeleteTenantUserDTO): Promise<DeleteTenantUserResponse> {
    try {
      const user = await this.userRepo.getUserByUserId(request.userId);
      
      if (!user) {
        return left(new DeleteTenantUserErrors.UserNotFoundError());
      }

      // Mark user as deleted (soft delete)
      user.delete();
      await this.userRepo.save(user);

      return right(Result.ok<void>());
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class DeleteTenantUserController extends BaseController {
  private useCase: DeleteTenantUserUseCase;

  constructor(useCase: DeleteTenantUserUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const dto: DeleteTenantUserDTO = req.body as DeleteTenantUserDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;

        switch (error.constructor) {
          case DeleteTenantUserErrors.UserNotFoundError:
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
export function createDeleteTenantUserComponents(userRepo: IUserRepo) {
  const deleteTenantUserUseCase = new DeleteTenantUserUseCase(userRepo);
  const deleteTenantUserController = new DeleteTenantUserController(deleteTenantUserUseCase);

  return { deleteTenantUserUseCase, deleteTenantUserController }
}