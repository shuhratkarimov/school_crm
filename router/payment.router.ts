import { RequestHandler, Router } from "express"
import { createPayment, deletePayment, getOnePayment, getPayments, getUnpaidPayments, getYearlyPayments, updatePayment } from "../controller/payments.ctr"
import { paymentAlert } from "../controller/payment-alert.ctr"
const PaymentRouter:Router = Router()

PaymentRouter.get("/get_payments", getPayments as RequestHandler)
PaymentRouter.get("/get_one_payment/:id", getOnePayment as RequestHandler)
PaymentRouter.post("/create_payment", createPayment as RequestHandler)
PaymentRouter.put("/update_payment/:id", updatePayment as RequestHandler)
PaymentRouter.delete("/delete_payment/:id", deletePayment as RequestHandler)
PaymentRouter.get("/get_yearly_payments", getYearlyPayments as RequestHandler)
PaymentRouter.post("/payment_alert/:studentId", paymentAlert as RequestHandler)
PaymentRouter.get("/get_unpaid_payments", getUnpaidPayments as RequestHandler)


export {
    PaymentRouter
}