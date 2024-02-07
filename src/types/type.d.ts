import { Request } from "express";
import { User } from "../models/User";
import type { SuccessRequest } from "../middleware/successHandler";

declare global {
  namespace Express {
    interface Request {
      user?: User; // Define your custom user property here
    }

    interface Response {
      success: (successRequestInput: SuccessRequest) => void;
    }
  }
}
