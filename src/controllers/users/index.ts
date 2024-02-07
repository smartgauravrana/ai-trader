import type { CreateUserRequest } from "../../dto/user";
import { type Response, type Request } from "express";
import { UserMetadata, UserModel } from "../../models/User";
import type { UpdateUserRequest } from "./schema";

export async function createUser(
  req: Request<{}, {}, CreateUserRequest>,
  res: Response
) {
  const data = await UserModel.create(req.body);
  res.send({
    data,
  });
}

export async function updateProfile(
  req: Request<{ userId: string }, {}, UpdateUserRequest>,
  res: Response
) {
  const { userId } = req.params;
  if (req.user?.id.toString() !== userId) {
    return res.status(403).send();
  }

  const { metadata } = req.body;

  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).send({ message: "no user found" });
  }
  user.metadata = {
    ...(user?.metadata || {}),
    ...metadata,
  } as any;

  await user.save();
  res.send({
    data: user,
  });
}
