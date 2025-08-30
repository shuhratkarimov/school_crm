import { RequestHandler, Router } from "express"
import { checkAuth, checkTeacherAuth, login, logout, register, resendVerificationCode, verify, changePassword, getProfile, updateProfile } from "../controller/auth.ctr"
const UserRouter:Router = Router()

UserRouter.put("/update-profile", updateProfile as RequestHandler)
UserRouter.get("/check-auth", checkAuth as RequestHandler)
UserRouter.post("/register", register as RequestHandler)
UserRouter.post("/verify", verify as RequestHandler)
UserRouter.post("/login", login as RequestHandler)
UserRouter.get("/resend_verification_code", resendVerificationCode as RequestHandler)
UserRouter.post("/logout", logout as RequestHandler)
UserRouter.get("/check-teacher-auth", checkTeacherAuth as RequestHandler)
UserRouter.post("/change-password", changePassword as RequestHandler)
UserRouter.get("/get-profile", getProfile as RequestHandler)
export {
    UserRouter
}