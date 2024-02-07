import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "../../models/User";
import type { InviteUserRequest } from "./schema";

export async function inviteUser(
  req: Request<{}, {}, InviteUserRequest>,
  res: Response
) {
  try {
    const { phone, password, name } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { phone, password: hashedPassword, name };
    const data = await UserModel.create(newUser);

    res.status(201).json({ message: "User registered successfully", data });
  } catch (e: any) {
    console.log(e.message);
  }
}
