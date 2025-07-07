import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { createUserSchema, updateUserSchema } from "../validations";
import { CreateUserDto } from "../types/user.dto";

export class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const dto = createUserSchema.parse(req.body) as CreateUserDto;
      const user = await userService.createUser(dto);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getUsers(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const list = await userService.getUsers(tenantId);
    res.json(list);
  }

  async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto = updateUserSchema.parse(req.body);
      const updated = await userService.updateUser(id, dto);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
}

export const userController = new UserController();
