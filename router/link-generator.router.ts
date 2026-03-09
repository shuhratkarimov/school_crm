import { Router, RequestHandler } from "express";
import {
  getRegistrationLinks,
  createRegistrationLink,
  updateRegistrationLink,
  deleteRegistrationLink,
  getRegistrationLinkByToken
} from "../controller/link-generator.ctr";

import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";

const LinkGeneratorRouter: Router = Router();

const secured = [
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
] as RequestHandler[];

LinkGeneratorRouter.get("/get-registration-link-by-token/:token", getRegistrationLinkByToken as RequestHandler);
LinkGeneratorRouter.get("/get-registration-links", ...secured, getRegistrationLinks as RequestHandler);
LinkGeneratorRouter.post("/create-registration-link", ...secured, createRegistrationLink as RequestHandler);
LinkGeneratorRouter.put("/update-registration-link/:id", ...secured, updateRegistrationLink as RequestHandler);
LinkGeneratorRouter.delete("/delete-registration-link/:id", ...secured, deleteRegistrationLink as RequestHandler);

export { LinkGeneratorRouter };