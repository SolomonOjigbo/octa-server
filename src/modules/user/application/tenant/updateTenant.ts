import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import * as express from 'express';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { ITenantRepo } from '../../repos/tenantRepo';
import { Tenant } from '../../domain/tenant';
import { Address } from '../../../../shared/domain/nexa/address';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface UpdateTenantDTO {
  tenantId: string;
  name?: string;
  address?: AddressDTO;
  dbUrl?: string;
}

interface AddressDTO {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Error Classes
export namespace UpdateTenantErrors {
  export class TenantIdNotFoundError extends Result<UseCaseError> {
    constructor(tenantId: string) {
      super(false, {
        message: `The tenant id ${tenantId} was not found`
      } as UseCaseError);
    }
  }
}

// Response Type
type UpdateTenantResponse = Either<
  UpdateTenantErrors.TenantIdNotFoundError | 
  AppError.UnexpectedError, 
  Result<Tenant>
>;

// Use Case
export class UpdateTenantUseCase implements UseCase<UpdateTenantDTO, Promise<UpdateTenantResponse>> {
  private tenantRepo: ITenantRepo;

  constructor(tenantRepo: ITenantRepo) {
    this.tenantRepo = tenantRepo;
  }

  async execute(request: UpdateTenantDTO): Promise<UpdateTenantResponse> {
    try {
      const tenant = await this.tenantRepo.getTenantById(request.tenantId);

      if (!tenant) {
        return left(
          new UpdateTenantErrors.TenantIdNotFoundError(request.tenantId)
        );
      }

      // Build the full TenantProps object, merging updates with existing tenant data
      const updatedAddress =
        request.address && request.address.city && request.address.state && request.address.postalCode
          ? Address.create({
              city: request.address.city,
              state: request.address.state,
              postalCode: request.address.postalCode,
              country: request.address.country ?? tenant.address?.country
            }).getValue()
          : tenant.address;

      if (request.address && (!request.address.city || !request.address.state || !request.address.postalCode)) {
        return left(
          new AppError.UnexpectedError('Missing required address fields: city, state, or postalCode')
        );
      }

      const tenantProps = {
        name: request.name ?? tenant.name,
        companyName: tenant.companyName,
        email: tenant.email,
        password: tenant.password,
        username: tenant.username,
        phone: tenant.phone,
        dbUrl: request.dbUrl ?? tenant.dbUrl,
        address: updatedAddress
      };

      const tenantOrError = Tenant.create(tenantProps, tenant.tenantId.id);

      if (tenantOrError.isFailure) {
        return left(
          new AppError.UnexpectedError(tenantOrError.getErrorValue())
        );
      }

      const updatedTenant = tenantOrError.getValue();
      await this.tenantRepo.update(request.tenantId, updatedTenant);

      return right(Result.ok<Tenant>(updatedTenant));
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class UpdateTenantController extends BaseController {
  private useCase: UpdateTenantUseCase;

  constructor(useCase: UpdateTenantUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const dto: UpdateTenantDTO = req.body as UpdateTenantDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;

        switch (error.constructor) {
          case UpdateTenantErrors.TenantIdNotFoundError:
            return this.notFound(res, error.getErrorValue().message);
          default:
            return this.fail(res, error.getErrorValue().message);
        }
      } else {
        const updatedTenant = result.value.getValue();
        return this.ok(res, updatedTenant);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}

// Factory Function
export function createUpdateTenantComponents(tenantRepo: ITenantRepo) {
  const updateTenantUseCase = new UpdateTenantUseCase(tenantRepo);
  const updateTenantController = new UpdateTenantController(updateTenantUseCase);

  return { updateTenantUseCase, updateTenantController }
}