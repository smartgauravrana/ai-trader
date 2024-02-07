import { Request } from "express";
import { User } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: User; // Define your custom user property here
    }
  }
}
