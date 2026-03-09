import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-guard.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { accessScopeMiddleware } from "../middlewares/access-scope.middleware";
import { getDashboardStats, getRevenueChart, getBranchPerformance, getBranchesFullAnalytics, getGroupsAnalytics, getDirectorDebts, getTeachersAnalytics, getRoomsOccupancyAnalytics } from "../controller/director.ctr";
const DirectorRouter = Router()

DirectorRouter.get("/director-panel/dashboard/stats", authMiddleware, roleMiddleware("superadmin", "director"), accessScopeMiddleware, getDashboardStats)
DirectorRouter.get("/director-panel/dashboard/revenue", authMiddleware, roleMiddleware("superadmin", "director"), accessScopeMiddleware, getRevenueChart)
DirectorRouter.get("/director-panel/dashboard/branches", authMiddleware, roleMiddleware("superadmin", "director"), accessScopeMiddleware, getBranchPerformance)
DirectorRouter.get("/director-panel/branches/full-analytics", authMiddleware, roleMiddleware("superadmin", "director"), accessScopeMiddleware, getBranchesFullAnalytics)
DirectorRouter.get("/director-panel/groups/analytics", authMiddleware, roleMiddleware("superadmin", "director"), accessScopeMiddleware, getGroupsAnalytics)
DirectorRouter.get("/director-panel/debts", authMiddleware, roleMiddleware("superadmin", "director"), accessScopeMiddleware, getDirectorDebts)
DirectorRouter.get("/director-panel/teachers/analytics", authMiddleware, roleMiddleware("superadmin", "director"), accessScopeMiddleware, getTeachersAnalytics)
DirectorRouter.get("/director-panel/rooms/occupancy", authMiddleware, roleMiddleware("superadmin", "director"), accessScopeMiddleware, getRoomsOccupancyAnalytics)
export {
    DirectorRouter
}