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
import {
  createUser,
  getAllUsers,
  getCurrentUser,
  updateProfile,
} from "../controllers/users/index.ts";
import { getAuthUrl, handleRedirectUri } from "../controllers/fyers/index.ts";

import { getDashboardData, inviteUser } from "../controllers/admin/index.ts";
import { adminProtect } from "../middleware/adminProtect.ts";

const router = Router({ mergeParams: true });

router
  .route("/customers")
  .get(getCustomersList)
  .post(schemaValidation(createCustomerSchema), createCustomer);

router
  .route("/users")
  // .post(schemaValidation(createUserSchema), createUser)
  .get(adminProtect, getAllUsers);

router.route("/broker/login-url").get(getAuthUrl);

router.route("/redirect-fyers").get(handleRedirectUri);

// Admin routes
router.route("/admin/invite-user").post(inviteUser);
router.route("/admin/dashboard").get(adminProtect, getDashboardData);

// Users
router.route("/users/me").get(getCurrentUser);

router
  .route("/users/:userId")
  .put(schemaValidation(UpdateUserRequestSchema), updateProfile);

export default router;
