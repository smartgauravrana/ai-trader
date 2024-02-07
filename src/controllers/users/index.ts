import type { CreateUserRequest } from "../../dto/user";
import { type Response, type Request, type NextFunction } from "express";
import { UserMetadata, UserModel } from "../../models/User";
import type { UpdateUserRequest } from "./schema";
import { NotFound, Forbidden } from "http-errors";

export async function createUser(
  req: Request<{}, {}, CreateUserRequest>,
  res: Response
) {
  const data = await UserModel.create(req.body);
  res.success({
    data,
  });
}

export async function updateProfile(
  req: Request<{ userId: string }, {}, UpdateUserRequest>,
  res: Response,
  next: NextFunction
) {
  const { userId } = req.params;
  if (req.user?.id.toString() !== userId) {
    // return res.status(403).send();
    return next(Forbidden());
  }

  const { metadata } = req.body;

  const user = await UserModel.findById(userId);
  if (!user) {
    // return res.status(404).send({ message: "no user found" });
    return next(NotFound("User not found"));
  }
  user.metadata = {
    ...(user?.metadata || {}),
    ...metadata,
  } as any;

  await user.save();
  res.success({ data: user });
}
