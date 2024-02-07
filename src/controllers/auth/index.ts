import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../../models/User";
import type { Request, Response } from "express";

const { JWT_SECRET_KEY } = process.env;

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    const dbUser = await UserModel.findOne({ phone }).lean();
    const hashedPwd = await bcrypt.hash(password, 10);

    if (!dbUser) {
      return res.status(404).json({ message: "Not Found" });
    }

    if (await bcrypt.compare(password, dbUser.password)) {
      const token = jwt.sign(
        {
          id: dbUser._id.toString(),
          phone: dbUser.phone,
          name: dbUser.name,
          isAdmin: dbUser.isAdmin,
          email: dbUser.email || "",
        },
        JWT_SECRET_KEY!,
        { expiresIn: 60 * 60 * 24 * 7 } // 7 days
      );
      // Set JWT token in cookie
      res.cookie("jwt", token, { httpOnly: true });
      return res.json({ token });
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  } catch (e: any) {
    console.log(e.message);
  }
};
