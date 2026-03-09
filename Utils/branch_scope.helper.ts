import { Op } from "sequelize";

export function withBranchScope(req: any, baseWhere: any = {}, branchField = "branch_id") {
  const scope = req.scope;
  if (!scope || scope.all) return baseWhere;

  return {
    ...baseWhere,
    [branchField]: { [Op.in]: scope.branchIds },
  };
}