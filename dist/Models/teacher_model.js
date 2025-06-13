"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class Group extends sequelize_1.Model {
}
Group.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    group_subject: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    days: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    start_time: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: false,
    },
    end_time: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: false,
    },
    teacher_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'teachers',
            key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    teacher_phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    monthly_fee: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    students_amount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    paid_students_amount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
}, {
    sequelize: database_config_1.default,
    tableName: 'groups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
exports.default = Group;
