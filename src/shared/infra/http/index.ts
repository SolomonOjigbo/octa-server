import { Middleware } from "./middleware/Middleware";
import { authService } from "../../../modules/user/services";
import { RequestMiddleware } from "./middleware/RequestMiddleware";
const middleware = new Middleware(authService);
const requestMiddleware = new RequestMiddleware();
export { middleware,requestMiddleware }
