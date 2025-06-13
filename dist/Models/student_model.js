"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class Student extends sequelize_1.Model {
}
Student.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    group_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'groups',
            key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    teacher_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'teachers',
            key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    full_name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    parent_phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    payment_status: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    balance: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    telegram_id: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
}, {
    sequelize: database_config_1.default,
    tableName: 'students',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
exports.default = Student;
