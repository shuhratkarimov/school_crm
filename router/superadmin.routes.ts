import { Router } from "express";
import { superadminMiddleware } from "../middlewares/admin.middleware";
import { createBranch, deleteBranch, getAllBranches, getOneBranch, getAllUsers, assignDirector, assignManager, updateBranch, superadminLogin, checkCpanelAuth, getAllDirectors, getOneDirector, getAllCenters, getOneCenter, updateCenter, deleteCenter, deleteDirector, createCenter, fastRegisterUserBySuperadmin, updateUserBySuperadmin, deleteUserBySuperadmin, changeRole } from "../controller/superadmin.ctr";
import { RequestHandler } from "express";
import { authMiddleware } from "../middlewares/auth-guard.middleware";

const SuperadminRouter: Router = Router()

SuperadminRouter.get("/check-cpanel-auth", checkCpanelAuth as RequestHandler)
SuperadminRouter.post("/cpanel-login", superadminLogin as RequestHandler)

SuperadminRouter.get("/branches", authMiddleware, superadminMiddleware, getAllBranches as RequestHandler)
SuperadminRouter.get("/branches/:id", authMiddleware, superadminMiddleware, getOneBranch as RequestHandler)
SuperadminRouter.post("/create_branch", authMiddleware, superadminMiddleware, createBranch as RequestHandler)
SuperadminRouter.put("/update_branch/:id", authMiddleware, superadminMiddleware, updateBranch as RequestHandler)
SuperadminRouter.delete("/delete_branch/:id", authMiddleware, superadminMiddleware, deleteBranch as RequestHandler)
SuperadminRouter.get("/users", authMiddleware, superadminMiddleware, getAllUsers as RequestHandler)

SuperadminRouter.put(
    "/centers/:centerId/assign-director",
    authMiddleware,
    superadminMiddleware,
    assignDirector as RequestHandler
);
SuperadminRouter.put("/branches/:branchId/assign-manager", authMiddleware, superadminMiddleware, assignManager as RequestHandler)
SuperadminRouter.post("/create_center", authMiddleware, superadminMiddleware, createCenter as RequestHandler)
SuperadminRouter.get("/centers", authMiddleware, superadminMiddleware, getAllCenters as RequestHandler)
SuperadminRouter.get("/centers/:id", authMiddleware, superadminMiddleware, getOneCenter as RequestHandler)
SuperadminRouter.put("/centers/:id", authMiddleware, superadminMiddleware, updateCenter as RequestHandler)
SuperadminRouter.delete("/centers/:id", authMiddleware, superadminMiddleware, deleteCenter as RequestHandler)

SuperadminRouter.get("/directors", authMiddleware, superadminMiddleware, getAllDirectors as RequestHandler)
SuperadminRouter.get("/directors/:id", authMiddleware, superadminMiddleware, getOneDirector as RequestHandler)
SuperadminRouter.delete("/directors/:id", authMiddleware, superadminMiddleware, deleteDirector as RequestHandler)

SuperadminRouter.put("/change-role/:userId", authMiddleware, superadminMiddleware, changeRole as RequestHandler)
SuperadminRouter.post("/fast-register-user-by-superadmin", authMiddleware, superadminMiddleware, fastRegisterUserBySuperadmin as RequestHandler)
SuperadminRouter.put("/update-user-by-superadmin/:id", authMiddleware, superadminMiddleware, updateUserBySuperadmin as RequestHandler)
SuperadminRouter.delete("/delete-user-by-superadmin/:id", authMiddleware, superadminMiddleware, deleteUserBySuperadmin as RequestHandler)

export default SuperadminRouter