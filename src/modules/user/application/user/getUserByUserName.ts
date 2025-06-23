import { BaseController } from '../../../../shared/infra/http/base/BaseController';
import * as express from 'express';
import { DecodedExpressRequest } from '../../infra/http/models/decodedRequest';
import { Either, Result, left, right } from '../../../../shared/core/Result';
import { AppError } from '../../../../shared/core/AppError';
import { UseCase } from '../../../../shared/core/UseCase';
import { IUserRepo } from '../../repos/userRepo';
import { UserName } from '../../domain/userName';
import { User } from '../../domain/user';
import { UseCaseError } from '../../../../shared/core/UseCaseError';

// DTO Interface
export interface GetUserByUserNameDTO {
  username: string;
}

// Error Classes
export namespace GetUserByUserNameErrors {
  export class UserNotFoundError extends Result<UseCaseError> {
    constructor(username: string) {
      super(false, {
        message: `No user with the username ${username} was found`
      } as UseCaseError);
    }
  }
}

// Response Type
type GetUserByUserNameResponse = Either<
  GetUserByUserNameErrors.UserNotFoundError | 
  AppError.UnexpectedError, 
  Result<User>
>;

// Use Case
export class GetUserByUserName implements UseCase<GetUserByUserNameDTO, Promise<GetUserByUserNameResponse>> {
  private userRepo: IUserRepo;

  constructor(userRepo: IUserRepo) {
    this.userRepo = userRepo;
  }

  public async execute(request: GetUserByUserNameDTO): Promise<GetUserByUserNameResponse> {
    try {
      const userNameOrError = UserName.create({ name: request.username });

      if (userNameOrError.isFailure) {
        return left(Result.fail<any>(userNameOrError.getErrorValue().toString()));
      }

      const userName = userNameOrError.getValue();
      const user = await this.userRepo.getUserByUserName(userName);

      if (!user) {
        return left(new GetUserByUserNameErrors.UserNotFoundError(userName.value));
      }

      return right(Result.ok<User>(user));
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}

// Controller
export class GetUserByUserNameController extends BaseController {
  private useCase: GetUserByUserName;

  constructor(useCase: GetUserByUserName) {
    super();
    this.useCase = useCase;
  }

  async executeImpl(
    req: DecodedExpressRequest,
    res: express.Response
  ): Promise<any> {
    const dto: GetUserByUserNameDTO = req.body as GetUserByUserNameDTO;

    try {
      const result = await this.useCase.execute(dto);

      if (result.isLeft()) {
        const error = result.value;
        switch (error.constructor) {
          case GetUserByUserNameErrors.UserNotFoundError:
            return this.notFound(res, error.getErrorValue().message);
          default:
            return this.fail(res, error.getErrorValue().message);
        }
      } else {
        const user = result.value.getValue();
        return this.ok(res, user);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}

// Factory Function
export function createGetUserByUserNameComponents(userRepo: IUserRepo) {
  const getUserByUserName = new GetUserByUserName(userRepo);
  const getUserByUserNameController = new GetUserByUserNameController(getUserByUserName);
  return { getUserByUserName, getUserByUserNameController };
}