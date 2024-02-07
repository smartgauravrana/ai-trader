import { Router } from "express";
import {
  createCustomer,
  getCustomersList,
} from "../controllers/customers/index.ts";
import { schemaValidation } from "../middleware/validate.ts";
import { createCustomerSchema } from "../controllers/customers/schema.ts";
import {
  UpdateUserRequestSchema,
  createUserSchema,
} from "../controllers/users/schema.ts";
import { createUser, updateProfile } from "../controllers/users/index.ts";
import { getAuthUrl, handleRedirectUri } from "../controllers/fyers/index.ts";

import { inviteUser } from "../controllers/admin/index.ts";

const router = Router({ mergeParams: true });

router
  .route("/customers")
  .get(getCustomersList)
  .post(schemaValidation(createCustomerSchema), createCustomer);

router.route("/users").post(schemaValidation(createUserSchema), createUser);

router.route("/broker/login-url").get(getAuthUrl);

router.route("/redirect-fyers").get(handleRedirectUri);

router.route("/admin/invite-user").post(inviteUser);

// Users
router
  .route("/users/:userId")
  .put(schemaValidation(UpdateUserRequestSchema), updateProfile);

export default router;
