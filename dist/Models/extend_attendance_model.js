"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceExtension = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
const sequelize_2 = require("sequelize");
class AttendanceExtension extends sequelize_2.Model {
}
exports.AttendanceExtension = AttendanceExtension;
AttendanceExtension.init({
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
    extended_until: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    }
}, {
    sequelize: database_config_1.default,
    tableName: "attendance_extensions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
