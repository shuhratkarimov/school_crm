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
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
// Middlewares
app.use(i18next_http_middleware_1.default.handle(lang_1.default));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({ credentials: true, origin: process.env.ALLOWED_ORIGINS || '*' }));
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
// Error handling
app.use(error_middleware_1.default);
// Server start
const start = async () => {
    try {
        await database_config_1.default.authenticate();
        console.log('✅ Database connected successfully!');
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log("Test CI CD");
        });
    }
    catch (error) {
        console.error('❌ Unable to start the server:', error);
        process.exit(1);
    }
};
start();
