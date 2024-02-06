import { Router } from "express";
import {
  createCustomer,
  getCustomersList,
} from "../controllers/customers/index.ts";
import { schemaValidation } from "../middleware/validate.ts";
import { createCustomerSchema } from "../controllers/customers/schema.ts";
import { createUserSchema } from "../controllers/users/schema.ts";
import { createUser } from "../controllers/users/index.ts";
import { getAuthUrl, handleRedirectUri } from "../controllers/fyers/index.ts";
import bcrypt from "bcrypt";
import { UserModel } from "../models/User.ts";
import jwt from "jsonwebtoken";

const router = Router({ mergeParams: true });

const { JWT_SECRET_KEY } = process.env;

router
  .route("/customers")
  .get(getCustomersList)
  .post(schemaValidation(createCustomerSchema), createCustomer);

router.route("/users").post(schemaValidation(createUserSchema), createUser);

router.route("/broker/login").get(getAuthUrl);

router.route("/redirect-fyers").get(handleRedirectUri);

router.route("/register").post(async (req, res) => {
  try {
    const { phone, password, name } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { phone, password: hashedPassword, name };
    await UserModel.create(newUser);

    res
      .status(201)
      .json({ message: "User registered successfully", data: newUser });
  } catch (e: any) {
    console.log(e.message);
  }
});

router.route("/login").post(async (req, res) => {
  try {
    const { phone, password } = req.body;
    const dbUser = await UserModel.findOne({ phone }).lean();
    const hashedPwd = await bcrypt.hash(password, 10);

    if (!dbUser) {
      return res.status(404).json({ message: "Not Found" });
    }

    console.log("dbUser: ", dbUser, hashedPwd);

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
});

export default router;
