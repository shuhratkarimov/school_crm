"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const lang_1 = __importDefault(require("./Utils/lang"));
const database_config_1 = __importDefault(require("./config/database.config"));
const error_middleware_1 = __importDefault(require("./Utils/error_middleware"));
// Routers
const student_router_1 = require("./router/student.router");
const payment_router_1 = require("./router/payment.router");
const teacher_router_1 = require("./router/teacher.router");
const appeals_router_1 = require("./router/appeals.router");
const group_router_1 = require("./router/group.router");
const user_router_1 = require("./router/user.router");
const search_router_1 = require("./router/search.router");
const centers_router_1 = require("./router/centers.router");
const notifications_router_1 = require("./router/notifications_router");
const room_router_1 = require("./router/room.router");
const schedules_router_1 = __importDefault(require("./router/schedules.router"));
const note_router_1 = require("./router/note.router");
const expenses_router_1 = require("./router/expenses.router");
const achievements_router_1 = require("./router/achievements.router");
const test_router_1 = require("./router/test.router");
const newStudent_router_1 = require("./router/newStudent.router");
const link_generator_router_1 = require("./router/link-generator.router");
const superadmin_routes_1 = __importDefault(require("./router/superadmin.routes"));
const director_routes_1 = require("./router/director.routes");
const settings_routes_1 = require("./router/settings.routes");
const user_notifications_routes_1 = require("./router/user_notifications.routes");
const missing_classes_cron_1 = require("./Utils/missing-classes.cron");
const daily_report_cron_1 = require("./Utils/daily-report.cron");
const weekly_report_cron_1 = require("./Utils/weekly-report.cron");
const reports_routes_1 = require("./router/reports.routes");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
// Middlewares
app.use(i18next_http_middleware_1.default.handle(lang_1.default));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
const allowedOrigins = [
    'http://admin.intellectualprogress.uz',
    'https://admin.intellectualprogress.uz',
    'http://register.intellectualprogress.uz',
    'https://register.intellectualprogress.uz',
    'http://teacher.intellectualprogress.uz',
    'https://teacher.intellectualprogress.uz',
    'http://193.181.208.209:8080',
    'http://localhost:5173',
];
app.use((0, cors_1.default)({ credentials: true, origin: allowedOrigins }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use(student_router_1.StudentsRouter);
app.use(payment_router_1.PaymentRouter);
app.use(teacher_router_1.TeacherRouter);
app.use(appeals_router_1.AppealRouter);
app.use(group_router_1.GroupRouter);
app.use(user_router_1.UserRouter);
app.use(search_router_1.SearchRouter);
app.use(notifications_router_1.NotificationsRouter);
app.use(centers_router_1.CenterRouter);
app.use(room_router_1.RoomRouter);
app.use(schedules_router_1.default);
app.use(note_router_1.NoteRouter);
app.use(expenses_router_1.ExpenseRouter);
app.use(achievements_router_1.AchievementsRouter);
app.use(test_router_1.testRouter);
app.use(newStudent_router_1.NewStudentRouter);
app.use(link_generator_router_1.LinkGeneratorRouter);
app.use(director_routes_1.DirectorRouter);
app.use("/superadmin", superadmin_routes_1.default);
app.use(settings_routes_1.SettingsRouter);
app.use(user_notifications_routes_1.UserNotificationRouter);
app.use(reports_routes_1.ReportsRouter);
(0, daily_report_cron_1.startDailyReportNotifier)();
(0, weekly_report_cron_1.startWeeklyReportNotifier)();
(0, missing_classes_cron_1.startAttendanceMissingNotifier)();
app.use(error_middleware_1.default);
async function start() {
    try {
        await database_config_1.default.authenticate();
        console.log('Database connected successfully!');
    }
    catch (error) {
        console.error('Unable to start the server:', error);
        process.exit(1);
    }
}
start();
exports.default = app;
