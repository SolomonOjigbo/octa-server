import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { createUserSchema } from "../validations";
import { CreateUserDto } from "../types/user.dto";

export class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const validated = createUserSchema.parse(req.body) as CreateUserDto;
      const user = await userService.createUser(validated);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
  async getUsers(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const users = await userService.getUsers(tenantId);
    res.json(users);
  }
  async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  }
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = createUserSchema.partial().parse(req.body);
      const user = await userService.updateUser(id, validated);
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

    async deleteUser(req: Request, res: Response) {
        const { id } = req.params;
        const result = await userService.deleteUser(id);
        if (result.count === 0) return res.status(404).json({ message: "Not found" });
        res.status(204).send();
    }
}
export const userController = new UserController();
