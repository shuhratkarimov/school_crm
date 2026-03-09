"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessScopeMiddleware = accessScopeMiddleware;
const Models_1 = require("../Models");
const base_error_1 = require("../Utils/base_error");
async function accessScopeMiddleware(req, res, next) {
    try {
        if (!req.user)
            return next(base_error_1.BaseError.BadRequest(401, "Unauthorized"));
        // ✅ Superadmin: hammasi ochiq
        if (req.user.role === "superadmin") {
            req.scope = { all: true, branchIds: [] };
            return next();
        }
        // ✅ Manager: faqat o'z branch'i
        if (req.user.role === "manager") {
            if (!req.user.branch_id)
                return next(base_error_1.BaseError.BadRequest(403, "Manager branch biriktirilmagan"));
            req.scope = { all: false, branchIds: [req.user.branch_id] };
            return next();
        }
        // ✅ Director: o'z center'iga tegishli barcha branchlar
        if (req.user.role === "director") {
            const center = await Models_1.Center.findOne({
                where: { director_id: req.user.id },
                attributes: ["id"],
            });
            if (!center)
                return next(base_error_1.BaseError.BadRequest(403, "Director center biriktirilmagan"));
            const branches = await Models_1.Branch.findAll({
                where: { center_id: center.get("id") },
                attributes: ["id"],
            });
            req.scope = { all: false, branchIds: branches.map(b => b.get("id")) };
            return next();
        }
        return next(base_error_1.BaseError.BadRequest(403, "Forbidden"));
    }
    catch (e) {
        next(e);
    }
}
