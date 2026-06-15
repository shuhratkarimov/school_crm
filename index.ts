import express from 'express';
import path from 'path';
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
import { RoomRouter } from './router/room.router';
import ScheduleRouter from './router/schedules.router';
import { NoteRouter } from './router/note.router';
import { ExpenseRouter } from './router/expenses.router';
import { AchievementsRouter } from './router/achievements.router';
import { testRouter } from './router/test.router';
import { NewStudentRouter } from './router/newStudent.router';
import { LinkGeneratorRouter } from './router/link-generator.router';
import SuperadminRouter from './router/superadmin.routes';
import { DirectorRouter } from './router/director.routes';
import { SettingsRouter } from './router/settings.routes';
import { UserNotificationRouter } from './router/user_notifications.routes';
import { startAttendanceMissingNotifier } from './Utils/missing-classes.cron';
import { startDailyReportNotifier } from './Utils/daily-report.cron';
import { startWeeklyReportNotifier } from './Utils/weekly-report.cron';
import { ReportsRouter } from './router/reports.routes';
import PlatformReviewRouter from './router/platform_review.routes';
import { router as FeedbackRouter } from './router/feedback.routes';
import ArticleRouter from './router/article.routes';
import { ExportRouter } from './router/export.router';
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(i18nextMiddleware.handle(i18next));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  maxAge: "7d",
  fallthrough: true,
}));
const allowedOrigins = [
  'http://admin.intellectualprogress.uz',
  'https://admin.intellectualprogress.uz',
  'http://register.intellectualprogress.uz',
  'https://register.intellectualprogress.uz',
  'http://teacher.intellectualprogress.uz',
  'https://teacher.intellectualprogress.uz',
  'http://director.intellectualprogress.uz',
  'https://director.intellectualprogress.uz',
  'http://193.181.208.209:8080',
  'http://localhost:5173',
];
app.use(cors({ credentials: true, origin: allowedOrigins }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

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
app.use(RoomRouter);
app.use(ScheduleRouter);
app.use(NoteRouter);
app.use(ExpenseRouter);
app.use(AchievementsRouter);
app.use(testRouter);
app.use(NewStudentRouter);
app.use(LinkGeneratorRouter)
app.use(DirectorRouter)
app.use("/superadmin", SuperadminRouter)
app.use(SettingsRouter)
app.use(UserNotificationRouter)
app.use(ReportsRouter)
app.use(FeedbackRouter)
app.use(PlatformReviewRouter)
app.use(ArticleRouter)
app.use(ExportRouter)

startDailyReportNotifier();
startWeeklyReportNotifier();
startAttendanceMissingNotifier();

app.use(errorMiddleware as any);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully!');
  } catch (error) {
    console.error('Unable to start the server:', error);
    process.exit(1);
  }
}

start();

export default app;