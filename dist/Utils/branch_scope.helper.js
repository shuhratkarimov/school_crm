"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withBranchScope = withBranchScope;
const sequelize_1 = require("sequelize");
function withBranchScope(req, baseWhere = {}, branchField = "branch_id") {
    const scope = req.scope;
    if (!scope || scope.all)
        return baseWhere;
    return {
        ...baseWhere,
        [branchField]: { [sequelize_1.Op.in]: scope.branchIds },
    };
}
