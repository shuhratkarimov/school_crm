import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";
import { getDailyReport, getWeeklyReport, testDailyReportNotification, testWeeklyReportNotification } from "../controller/reports.ctr";

const ReportsRouter = Router();

ReportsRouter.get(
  "/director-panel/reports/daily",
  authMiddleware,
  roleMiddleware("superadmin", "director"),
  accessScopeMiddleware,
  getDailyReport
);

ReportsRouter.get(
  "/director-panel/reports/weekly",
  authMiddleware,
  roleMiddleware("superadmin", "director"),
  accessScopeMiddleware,
  getWeeklyReport
);

ReportsRouter.get(
    "/director-panel/reports/test-weekly",
    authMiddleware,
    roleMiddleware("superadmin", "director"),
    accessScopeMiddleware,
    testWeeklyReportNotification
);

ReportsRouter.get(
    "/director-panel/reports/test-daily",
    authMiddleware,
    roleMiddleware("superadmin", "director"),
    accessScopeMiddleware,
    testDailyReportNotification
);

export { ReportsRouter };