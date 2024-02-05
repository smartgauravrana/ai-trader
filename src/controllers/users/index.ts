import type { CreateUserRequest } from "../../dto/user";
import { type Response, type Request } from "express";
import { UserModel } from "../../models/User";

export async function createUser(
  req: Request<{}, {}, CreateUserRequest>,
  res: Response
) {
  const data = await UserModel.create(req.body);
  res.send({
    data,
  });
}
