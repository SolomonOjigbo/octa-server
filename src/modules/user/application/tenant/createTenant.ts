import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import * as express from 'express';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { ITenantRepo } from '../../repos/tenantRepo';
import { Address } from '../../../../shared/domain/nexa/address';
import { Tenant } from '../../domain/tenant';
import { DatabaseService } from '../../../../shared/services/DatabaseService';
import { IAuthService } from '../../services/auth.service';
import { UserPassword } from '../../domain/userPassword';
import { PrismaMigrationService } from '../../../../shared/utils/DBUtils';
import { UniqueEntityID } from '../../../../shared/domain/UniqueEntityID';
import { DomainEvents } from '../../../../shared/domain/events/DomainEvents';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interfaces
export interface CreateTenantDTO {
  companyName: string;
  address: {
    street?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  dbUrl?: string;
  email: string;
  password: string;
  phone: string;
  name: string;
  username: string;
}

export interface CreateTenantResponseDTO {
  name: string;
  tenantId: string;
}

// Error Classes
export namespace CreateTenantErrors {
  export class TenantNameTakenError extends Result<UseCaseError> {
    constructor(tenantName: string) {
      super(false, {
        message: `The tenant name ${tenantName} was already taken`
      } as UseCaseError);
    }
  }
}

// Response Type
type CreateTenantResponse = Either<
  CreateTenantErrors.TenantNameTakenError | 
  AppError.UnexpectedError,
  Result<CreateTenantResponseDTO>
>;

// Use Case
export class CreateTenantUseCase implements UseCase<CreateTenantDTO, Promise<CreateTenantResponse>> {
  private tenantRepo: ITenantRepo;
  private authService: IAuthService;

  constructor(tenantRepo: ITenantRepo, authService: IAuthService) {
    this.tenantRepo = tenantRepo;
    this.authService = authService;
  }

  async execute(request: CreateTenantDTO): Promise<CreateTenantResponse> {
    try {
      // Check if tenant name is already taken
      const tenantAlreadyExists = await this.tenantRepo.exists(request.name);
      if (tenantAlreadyExists) {
        return left(new CreateTenantErrors.TenantNameTakenError(request.name));
      }

      // Validate address
      const addressOrError = Address.create(request.address);
      if (addressOrError.isFailure) {
        return left(new AppError.UnexpectedError(addressOrError.getErrorValue().toString()));
      }

      // Validate password
      const passwordOrError = UserPassword.create({ value: request.password });
      if (passwordOrError.isFailure) {
        return left(new AppError.UnexpectedError(passwordOrError.getErrorValue().toString()));
      }
      const password = passwordOrError.getValue();

      // Create tenant entity
      const tenantOrError = Tenant.create({
        name: request.name,
        companyName: request.companyName,
        email: request.email,
        password,
        username: request.username,
        phone: request.phone,
        ...(request.dbUrl ? { dbUrl: request.dbUrl } : {}),
        address: addressOrError.getValue()
      });

      if (tenantOrError.isFailure) {
        return left(new AppError.UnexpectedError(tenantOrError.getErrorValue().toString()));
      }

      const tenant = tenantOrError.getValue();
      await this.tenantRepo.save(tenant);

      // Handle database setup
      if (request.dbUrl) {
        tenant.dbUrl = request.dbUrl;
        await this.authService.saveTenantDBUrl(tenant.tenantId.id.toString(), request.dbUrl);
      } else {
        await DatabaseService.createClientDatabase(tenant.tenantId.id.toString());
      }

      // Run database migrations
      const prismaMigrationService = new PrismaMigrationService(tenant.tenantId.id.toString());
      try {
        await prismaMigrationService.updateSchemaAndMigrate(request?.dbUrl);
      } catch (error) {
        console.error('Database migration failed', error);
        // Continue even if migration fails - this might need better handling
      }

      // Dispatch domain events
      DomainEvents.dispatchEventsForAggregate(new UniqueEntityID(tenant.tenantId.id.toString()));

      return right(Result.ok<CreateTenantResponseDTO>({
        tenantId: tenant.tenantId.id.toString(),
        name: tenant.name
      }));
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class CreateTenantController extends BaseController {
  private useCase: CreateTenantUseCase;

  constructor(useCase: CreateTenantUseCase) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const dto: CreateTenantDTO = req.body as CreateTenantDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;
        switch (error.constructor) {
          case CreateTenantErrors.TenantNameTakenError:
            return this.conflict(res, error.getErrorValue().message);
          default:
            return this.fail(res, error.getErrorValue().message);
        }
      } else {
        const responseDTO = result.value.getValue();
        return this.ok<CreateTenantResponseDTO>(res, responseDTO);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}

// Factory Function
export function createTenantComponents(tenantRepo: ITenantRepo, authService: IAuthService) {
  const createTenantUseCase = new CreateTenantUseCase(tenantRepo, authService);
  const createTenantController = new CreateTenantController(createTenantUseCase);
  return { createTenantUseCase, createTenantController }
}