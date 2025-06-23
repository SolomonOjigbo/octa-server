import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import * as express from 'express';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { ITenantRepo } from '../../repos/tenantRepo';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface DeleteTenantByIdDTO {
  tenantId: string;
}

// Error Classes
export namespace DeleteTenantByIdErrors {
  export class TenantNotFoundError extends Result<UseCaseError> {
    constructor(tenantId: string) {
      super(false, {
        message: `No tenant with the Id ${tenantId} was found`
      } as UseCaseError);
    }
  }
}

// Response Type
type DeleteTenantByIdResponse = Either<
  DeleteTenantByIdErrors.TenantNotFoundError | 
  AppError.UnexpectedError, 
  Result<void>
>;

// Use Case
export class DeleteTenantByIdUseCase implements UseCase<DeleteTenantByIdDTO, Promise<DeleteTenantByIdResponse>> {
  private tenantRepo: ITenantRepo;

  constructor(tenantRepo: ITenantRepo) {
    this.tenantRepo = tenantRepo;
  }

  public async execute(request: DeleteTenantByIdDTO): Promise<DeleteTenantByIdResponse> {
    try {
      const tenantExists = await this.tenantRepo.exists(request.tenantId);
      if (!tenantExists) {
        return left(
          new DeleteTenantByIdErrors.TenantNotFoundError(request.tenantId)
        );
      }

      await this.tenantRepo.delete(request.tenantId);
      return right(Result.ok<void>());
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class DeleteTenantByIdController extends BaseController {
  private useCase: DeleteTenantByIdUseCase;

  constructor(useCase: DeleteTenantByIdUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const dto: DeleteTenantByIdDTO = req.body as DeleteTenantByIdDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;

        switch (error.constructor) {
          case DeleteTenantByIdErrors.TenantNotFoundError:
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
export function createDeleteTenantComponents(tenantRepo: ITenantRepo) {
  const deleteTenantByIdUseCase = new DeleteTenantByIdUseCase(tenantRepo);
  const deleteTenantByIdController = new DeleteTenantByIdController(deleteTenantByIdUseCase);

  return { deleteTenantByIdUseCase, deleteTenantByIdController };
}