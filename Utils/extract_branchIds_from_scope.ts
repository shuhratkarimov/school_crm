import { Op } from "sequelize";

export function extractBranchIdsFromScope(scope: any): string[] {
    const where = scope?.where ?? {};
    const branchId = where.branch_id;

    if (!branchId) return [];

    if (Array.isArray(branchId)) {
        return branchId.map(String);
    }

    if (typeof branchId === "string" || typeof branchId === "number") {
        return [String(branchId)];
    }

    if (typeof branchId === "object") {
        if (branchId[Op.in] && Array.isArray(branchId[Op.in])) {
            return branchId[Op.in].map(String);
        }

        if (branchId[Op.eq] !== undefined && branchId[Op.eq] !== null) {
            return [String(branchId[Op.eq])];
        }
    }

    return [];
}