"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractBranchIdsFromScope = extractBranchIdsFromScope;
const sequelize_1 = require("sequelize");
function extractBranchIdsFromScope(scope) {
    const where = scope?.where ?? {};
    const branchId = where.branch_id;
    if (!branchId)
        return [];
    if (Array.isArray(branchId)) {
        return branchId.map(String);
    }
    if (typeof branchId === "string" || typeof branchId === "number") {
        return [String(branchId)];
    }
    if (typeof branchId === "object") {
        if (branchId[sequelize_1.Op.in] && Array.isArray(branchId[sequelize_1.Op.in])) {
            return branchId[sequelize_1.Op.in].map(String);
        }
        if (branchId[sequelize_1.Op.eq] !== undefined && branchId[sequelize_1.Op.eq] !== null) {
            return [String(branchId[sequelize_1.Op.eq])];
        }
    }
    return [];
}
