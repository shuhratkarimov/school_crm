import { RequestHandler, Router } from "express"
import { createPayment, deletePayment, getOnePayment, getPayments, getUnpaidPayments, getYearlyPayments, updatePayment } from "../controller/payments.ctr"
import { paymentAlert } from "../controller/payment-alert.ctr"
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";
const PaymentRouter: Router = Router()

PaymentRouter.get("/get_payments",
    authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware,
    getPayments as RequestHandler
);
PaymentRouter.get("/get_one_payment/:id", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getOnePayment as RequestHandler)
PaymentRouter.post("/create_payment", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, createPayment as RequestHandler)
PaymentRouter.put("/update_payment/:id", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, updatePayment as RequestHandler)
PaymentRouter.delete("/delete_payment/:id", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, deletePayment as RequestHandler)
PaymentRouter.get("/get_yearly_payments", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getYearlyPayments as RequestHandler)
PaymentRouter.post("/payment_alert/:studentId", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, paymentAlert as RequestHandler)
PaymentRouter.get("/get_unpaid_payments", authMiddleware,
    roleMiddleware("manager", "director", "superadmin"),
    accessScopeMiddleware, getUnpaidPayments as RequestHandler)

export {
    PaymentRouter
}