import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import i18nextMiddleware from 'i18next-http-middleware';
import i18next from './Utils/lang';
import sequelize from './config/database.config';
import errorMiddleware from './Utils/error_middleware';

// Routers
import { StudentsRouter } from './router/student.router';
import { PaymentRouter } from './router/payment.router';
import { TeacherRouter } from './router/teacher.router';
import { AppealRouter } from './router/appeals.router';
import { GroupRouter } from './router/group.router';
import { UserRouter } from './router/user.router';
import { SearchRouter } from './router/search.router';
import { CenterRouter } from './router/centers.router';
import { NotificationsRouter } from './router/notifications_router';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(i18nextMiddleware.handle(i18next));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: process.env.ALLOWED_ORIGINS || '*' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(StudentsRouter);
app.use(PaymentRouter);
app.use(TeacherRouter);
app.use(AppealRouter);
app.use(GroupRouter);
app.use(UserRouter);
app.use(SearchRouter);
app.use(NotificationsRouter);
app.use(CenterRouter);

// Error handling
app.use(errorMiddleware as any);

console.log("Test CI CD");


// Server start
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start the server:', error);
    process.exit(1);
  }
};

start();