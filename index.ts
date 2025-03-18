import express from "express"
import dotenv from "dotenv"
import cors from "cors"
dotenv.config();
import cookieParser from "cookie-parser"
const PORT = process.env.PORT || 4001;
import errorMiddleware from "./Utils/error_middleware";
import { StudentsRouter } from "./router/student.router";
import { PaymentRouter } from "./router/payment.router";
import { TeacherRouter } from "./router/teacher.router";
import { AppealRouter } from "./router/appeals.router";
import { GroupRouter } from "./router/group.router";
import { UserRouter } from "./router/user.router";
import { SearchRouter } from "./router/search.router";
import { NotificationsRouter } from "./router/notifications_router";
import i18nextMiddleware from "i18next-http-middleware";
import i18next from "./Utils/lang";
const app = express();
app.use(i18nextMiddleware.handle(i18next));
app.use(express.json())
app.use(cookieParser())
app.use(cors({ credentials: true, origin: "*" }));
app.use(express.urlencoded({ extended: true }))
app.use(StudentsRouter)
app.use(PaymentRouter)
app.use(TeacherRouter)
app.use(AppealRouter)
app.use(GroupRouter)
app.use(UserRouter)
app.use(SearchRouter)
app.use(NotificationsRouter)

app.use(errorMiddleware)
app.listen(PORT, () => {
  console.log("Server is running on the port:" + PORT);
});
