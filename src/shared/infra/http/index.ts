import { Middleware } from "./middleware/Middleware";
import { authService } from "../../../modules/users/services";
import { RequestMiddleware } from "./middleware/RequestMiddleware";
const middleware = new Middleware(authService);
const requestMiddleware = new RequestMiddleware();
export { middleware,requestMiddleware }
