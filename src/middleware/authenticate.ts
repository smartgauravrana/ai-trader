import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";

const { JWT_SECRET_KEY } = process.env;

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies["jwt"];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Decode the JWT token
    const decodedToken: any = jwt.verify(token, JWT_SECRET_KEY!);

    // Check if token has expired
    if (Date.now() >= decodedToken.exp * 1000) {
      res.clearCookie("jwt");
      return res.status(401).json({ message: "Token expired" });
    }

    // The decoded payload (claims)
    const dbUser = await UserModel.findById(decodedToken.id);

    if (!dbUser) {
      res.clearCookie("jwt");
      return res.status(401).json({ message: "Unauthorised" });
    }

    // if (isAdminProtected && !dbUser.isAdmin) {
    //   return res.status(401).json({ message: "Unauthorised" });
    // }

    req.user = dbUser;
  } catch (error: any) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};
