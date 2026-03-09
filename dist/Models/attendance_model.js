"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRecord = exports.Attendance = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class Attendance extends sequelize_1.Model {
}
exports.Attendance = Attendance;
Attendance.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    group_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    }
}, {
    sequelize: database_config_1.default,
    tableName: "attendances",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
class AttendanceRecord extends sequelize_1.Model {
}
exports.AttendanceRecord = AttendanceRecord;
AttendanceRecord.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    attendance_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    student_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("present", "absent"),
        allowNull: false,
    },
    reason: {
        type: sequelize_1.DataTypes.ENUM("excused", "unexcused"),
        allowNull: true,
    },
    note: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_config_1.default,
    tableName: "attendance_records",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
