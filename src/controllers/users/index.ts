import type { CreateUserRequest } from "../../dto/user";
import { type Response, type Request, type NextFunction } from "express";
import { UserModel } from "../../models/User";
import type { UpdateUserRequest } from "./schema";
import { NotFound, Forbidden } from "http-errors";
import asyncHandler from "../../utils/asyncHandler";
import jwt from "jsonwebtoken";

interface DecodedToken {
  exp: number;
}

export function isTokenExpired(token: string): boolean {
  try {
    const decodedToken = jwt.decode(token) as DecodedToken;
    if (!decodedToken) {
      // Token is not valid or malformed
      return true;
    }
    const expirationTime = decodedToken.exp * 1000; // Convert seconds to milliseconds
    const currentTime = Date.now();
    return currentTime >= expirationTime;
  } catch (error: any) {
    console.error("Error decoding token:", error.message);
    return true; // Assume token is expired if there's an error
  }
}

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

  const { metadata, email, pauseTrades } = req.body;

  const user = await UserModel.findById(userId);
  if (!user) {
    return next(NotFound("User not found"));
  }
  user.metadata = {
    ...(user?.metadata || {}),

    ...(metadata || {}),
    ...(pauseTrades !== undefined ? { pauseTrades } : {}),
  } as any;
  user.email = email || user.email;
  await user.save();
  res.success({ data: user });
}

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await UserModel.findById(req.user?._id).lean();

    const refreshTknExpired = isTokenExpired(
      user?.metadata?.refreshToken || ""
    );

    if (!user) {
      throw NotFound("User not found");
    }

    res.success({
      data: { ...user, isTokenExpired: refreshTknExpired },
    });
  }
);

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const data = await UserModel.find({}).sort({ createdAt: -1 }).lean();

  res.success({
    data,
  });
});
