"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkGeneratorRouter = void 0;
const express_1 = require("express");
const link_generator_ctr_1 = require("../controller/link-generator.ctr");
const auth_guard_middleware_1 = require("../middlewares/auth-guard.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const access_scope_middleware_1 = require("../middlewares/access-scope.middleware");
const LinkGeneratorRouter = (0, express_1.Router)();
exports.LinkGeneratorRouter = LinkGeneratorRouter;
const secured = [
    auth_guard_middleware_1.authMiddleware,
    (0, role_middleware_1.roleMiddleware)("manager", "director", "superadmin"),
    access_scope_middleware_1.accessScopeMiddleware,
];
LinkGeneratorRouter.get("/get-registration-link-by-token/:token", link_generator_ctr_1.getRegistrationLinkByToken);
LinkGeneratorRouter.get("/get-registration-links", ...secured, link_generator_ctr_1.getRegistrationLinks);
LinkGeneratorRouter.post("/create-registration-link", ...secured, link_generator_ctr_1.createRegistrationLink);
LinkGeneratorRouter.put("/update-registration-link/:id", ...secured, link_generator_ctr_1.updateRegistrationLink);
LinkGeneratorRouter.delete("/delete-registration-link/:id", ...secured, link_generator_ctr_1.deleteRegistrationLink);
