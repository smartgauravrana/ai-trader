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

const router = Router({ mergeParams: true });

router
  .route("/customers")
  .get(getCustomersList)
  .post(schemaValidation(createCustomerSchema), createCustomer);

router.route("/users").post(schemaValidation(createUserSchema), createUser);

router.route("/broker/login").get(getAuthUrl);

router.route("/redirect-fyers").get(handleRedirectUri);

export default router;
