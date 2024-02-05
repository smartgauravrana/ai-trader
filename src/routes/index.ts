import { Router } from "express";
import {
  createCustomer,
  getCustomersList,
} from "../controllers/customers/index.ts";
import { schemaValidation } from "../middleware/validate.ts";
import { createCustomerSchema } from "../controllers/customers/schema.ts";

const router = Router({ mergeParams: true });

router
  .route("/customers")
  .get(getCustomersList)
  .post(schemaValidation(createCustomerSchema), createCustomer);

export default router;
