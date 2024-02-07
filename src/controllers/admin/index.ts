import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "../../models/User";
import type { InviteUserRequest } from "./schema";
import asyncHandler from "../../utils/asyncHandler";

export const inviteUser = asyncHandler(
  async (req: Request<{}, {}, InviteUserRequest>, res: Response) => {
    const { phone, password, name } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { phone, password: hashedPassword, name };
    const data = await UserModel.create(newUser);

    res.success({
      data,
    });
  }
);
