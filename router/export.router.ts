import { RequestHandler, Router } from "express";
import {
  exportStudents,
  exportTeachers,
  exportGroups,
  exportPayments,
  exportExpenses,
  exportAll,
  getExportFilters,
} from "../controller/export.ctr";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";

const ExportRouter: Router = Router();

// Barcha export endpointlar autentifikatsiya + rol + filial ruxsati (scope) bilan himoyalangan
const secured = [
  authMiddleware,
  roleMiddleware("manager", "director", "superadmin"),
  accessScopeMiddleware,
] as RequestHandler[];

// Dropdown filtrlari uchun (filiallar va guruhlar ro'yxati)
ExportRouter.get("/export/filters", ...secured, getExportFilters as RequestHandler);

// XLSX yuklab olish endpointlari
ExportRouter.get("/export/students", ...secured, exportStudents as RequestHandler);
ExportRouter.get("/export/teachers", ...secured, exportTeachers as RequestHandler);
ExportRouter.get("/export/groups", ...secured, exportGroups as RequestHandler);
ExportRouter.get("/export/payments", ...secured, exportPayments as RequestHandler);
ExportRouter.get("/export/expenses", ...secured, exportExpenses as RequestHandler);
ExportRouter.get("/export/all", ...secured, exportAll as RequestHandler);

export { ExportRouter };
