import type { CreateUserRequest } from "../../dto/user";
import { type Response, type Request, type NextFunction } from "express";
import { UserModel } from "../../models/User";
import type { UpdateUserRequest } from "./schema";
import { NotFound, Forbidden } from "http-errors";
import asyncHandler from "../../utils/asyncHandler";

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
    return next(Forbidden());
  }

  const { metadata } = req.body;

  const user = await UserModel.findById(userId);
  if (!user) {
    return next(NotFound("User not found"));
  }
  user.metadata = {
    ...(user?.metadata || {}),
    ...metadata,
  } as any;

  await user.save();
  res.success({ data: user });
}

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await UserModel.findById(req.user?._id);
    if (!user) {
      throw NotFound("User not found");
    }

    res.success({
      data: user,
    });
  }
);
