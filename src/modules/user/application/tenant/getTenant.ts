import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import * as express from 'express';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { ITenantRepo } from '../../repos/tenantRepo';
import { Tenant } from '../../domain/tenant';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface GetTenantByIdDTO {
  tenantId: string;
}

// Error Classes
export namespace GetTenantByIdErrors {
  export class TenantNotFoundError extends Result<UseCaseError> {
    constructor(tenantId: string) {
      super(false, {
        message: `No tenant with the Id ${tenantId} was found`
      } as UseCaseError);
    }
  }
}

// Response Type
type GetTenantByIdResponse = Either<
  GetTenantByIdErrors.TenantNotFoundError | 
  AppError.UnexpectedError, 
  Result<Tenant>
>;

// Use Case
export class GetTenantByIdUseCase implements UseCase<GetTenantByIdDTO, Promise<GetTenantByIdResponse>> {
  private tenantRepo: ITenantRepo;

  constructor(tenantRepo: ITenantRepo) {
    this.tenantRepo = tenantRepo;
  }

  public async execute(request: GetTenantByIdDTO): Promise<GetTenantByIdResponse> {
    try {
      const tenant = await this.tenantRepo.getTenantById(request.tenantId);
      
      if (!tenant) {
        return left(
          new GetTenantByIdErrors.TenantNotFoundError(request.tenantId)
        );
      }

      return right(Result.ok<Tenant>(tenant));
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class GetTenantByIdController extends BaseController {
  private useCase: GetTenantByIdUseCase;

  constructor(useCase: GetTenantByIdUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const dto: GetTenantByIdDTO = req.body as GetTenantByIdDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;

        switch (error.constructor) {
          case GetTenantByIdErrors.TenantNotFoundError:
            return this.notFound(res, error.getErrorValue().message);
          default:
            return this.fail(res, error.getErrorValue().message);
        }
      } else {
        const tenant = result.value.getValue();
        return this.ok(res, tenant);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}

// Factory Function
export function createGetTenantComponents(tenantRepo: ITenantRepo) {
  const getTenantByIdUseCase = new GetTenantByIdUseCase(tenantRepo);
  const getTenantByIdController = new GetTenantByIdController(getTenantByIdUseCase);

  return { getTenantByIdUseCase, getTenantByIdController }
}