import { Op } from "sequelize";
import { Center, Branch } from "../Models";
import { BaseError } from "../Utils/base_error";

export async function accessScopeMiddleware(req: any, res: any, next: any) {
  try {
    if (!req.user) return next(BaseError.BadRequest(401, "Unauthorized"));

    // ✅ Superadmin: hammasi ochiq
    if (req.user.role === "superadmin") {
      req.scope = { all: true, branchIds: [] };
      return next();
    }

    // ✅ Manager: faqat o'z branch'i
    if (req.user.role === "manager") {
      if (!req.user.branch_id) return next(BaseError.BadRequest(403, "Manager branch biriktirilmagan"));
      req.scope = { all: false, branchIds: [req.user.branch_id] };
      return next();
    }

    // ✅ Director: o'z center'iga tegishli barcha branchlar
    if (req.user.role === "director") {
      const center = await Center.findOne({
        where: { director_id: req.user.id },
        attributes: ["id"],
      });
      if (!center) return next(BaseError.BadRequest(403, "Director center biriktirilmagan"));

      const branches = await Branch.findAll({
        where: { center_id: center.get("id") },
        attributes: ["id"],
      });

      req.scope = { all: false, branchIds: branches.map(b => b.get("id")) };
      return next();
    }

    return next(BaseError.BadRequest(403, "Forbidden"));
  } catch (e) {
    next(e);
  }
}