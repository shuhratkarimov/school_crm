import { RequestHandler, Router } from "express"
import { checkAuth, login, logout, register, resendVerificationCode, verify } from "../controller/auth.ctr"
const UserRouter:Router = Router()

UserRouter.get("/check-auth", checkAuth as RequestHandler)
UserRouter.post("/register", register as RequestHandler)
UserRouter.post("/verify", verify as RequestHandler)
UserRouter.post("/login", login as RequestHandler)
UserRouter.get("/resend_verification_code", resendVerificationCode as RequestHandler)
UserRouter.post("/logout", logout as RequestHandler)

export {
    UserRouter
}