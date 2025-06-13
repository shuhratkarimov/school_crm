"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class Attendance extends sequelize_1.Model {
}
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
        references: {
            model: 'groups',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    date: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    came_students: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
}, {
    sequelize: database_config_1.default,
    tableName: 'attendances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
exports.default = Attendance;
