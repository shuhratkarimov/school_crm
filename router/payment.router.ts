import { RequestHandler, Router } from "express"
import { createPayment, deletePayment, getOnePayment, getPayments, updatePayment } from "../controller/payments.ctr"
const PaymentRouter:Router = Router()

PaymentRouter.get("/get_payments", getPayments as RequestHandler)
PaymentRouter.get("/get_one_payment/:id", getOnePayment as RequestHandler)
PaymentRouter.post("/create_payment", createPayment as RequestHandler)
PaymentRouter.put("/update_payment/:id", updatePayment as RequestHandler)
PaymentRouter.delete("/delete_payment/:id", deletePayment as RequestHandler)

export {
    PaymentRouter
}