import { type Request, type Response, type NextFunction } from "express";
import { Forbidden } from "http-errors";

export const adminProtect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isAdmin = req.user?.isAdmin;
  if (!isAdmin) {
    return next(Forbidden("Only Admin is allowed"));
  }
  return next();
};
