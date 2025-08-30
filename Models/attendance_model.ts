import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.config";

export class Attendance extends Model {}
Attendance.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "attendances",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export class AttendanceRecord extends Model {}
AttendanceRecord.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    attendance_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("present", "absent"),
      allowNull: false,
    },
    reason: {
      type: DataTypes.ENUM("excused", "unexcused"),
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "attendance_records",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Attendance.sync({ force: false });
AttendanceRecord.sync({ force: false });