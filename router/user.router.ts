import { RequestHandler, Router } from "express"
import { checkAuth, checkTeacherAuth, login, logout, register, resendVerificationCode, verify, changePassword, getProfile, updateProfile, getMe, getAllUsers, getOneUser, updateUser, deleteUser, checkDirectorAuth, directorLogin } from "../controller/auth.ctr"
import { authMiddleware } from "../middlewares/auth-guard.middleware"
import { superadminMiddleware } from "../middlewares/admin.middleware"
const UserRouter: Router = Router()

UserRouter.put("/update-profile", updateProfile as RequestHandler)
UserRouter.get("/check-auth", checkAuth as RequestHandler)
UserRouter.post("/register", register as RequestHandler)
UserRouter.post("/verify", verify as RequestHandler)
UserRouter.post("/login", login as RequestHandler)
UserRouter.get("/resend_verification_code", resendVerificationCode as RequestHandler)
UserRouter.post("/logout", logout as RequestHandler)
UserRouter.get("/check-teacher-auth", checkTeacherAuth as RequestHandler)
UserRouter.post("/change-password", changePassword as RequestHandler)
UserRouter.get("/get-profile", authMiddleware, getProfile as RequestHandler)
UserRouter.get("/get-me", authMiddleware, getMe as RequestHandler)
UserRouter.get("/get-all-users", authMiddleware, superadminMiddleware, getAllUsers as RequestHandler)
UserRouter.get("/get-user/:id", authMiddleware, superadminMiddleware, getOneUser as RequestHandler)
UserRouter.put("/update-user/:id", authMiddleware, superadminMiddleware, updateUser as RequestHandler)
UserRouter.delete("/delete-user/:id", authMiddleware, superadminMiddleware, deleteUser as RequestHandler)
UserRouter.get("/check-director-auth", checkDirectorAuth as RequestHandler)
UserRouter.post("/director-login", directorLogin as RequestHandler)

export {
    UserRouter
}