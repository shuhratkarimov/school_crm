import { DataTypes } from "sequelize";
import sequelize from "../config/database.config";
import { Model } from "sequelize";

export class AttendanceExtension extends Model {}
AttendanceExtension.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    extended_until: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "attendance_extensions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);