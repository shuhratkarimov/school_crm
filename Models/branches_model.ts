import sequelize from "../config/database.config";
import { DataTypes } from "sequelize";

const Branch = sequelize.define("Branch", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },      // ✅ DB’da bor
    address: { type: DataTypes.STRING, allowNull: false },
    manager_id: { type: DataTypes.UUID, allowNull: true },
    center_id: { type: DataTypes.UUID, allowNull: true },     // ✅ yangi
  }, {
    tableName: "branches",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

export default Branch;