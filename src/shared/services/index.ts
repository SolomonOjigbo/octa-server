import { authService } from "../../modules/user/services";
import { DatabaseService } from "./DatabaseService";

const databaseService = new DatabaseService(authService);


export { databaseService }