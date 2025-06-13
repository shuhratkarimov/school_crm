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
    first_name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    last_name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    father_name: sequelize_1.DataTypes.STRING,
    mother_name: sequelize_1.DataTypes.STRING,
    birth_date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    phone_number: sequelize_1.DataTypes.STRING,
    group_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'groups',
            key: 'id',
        },
    },
    teacher_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'teachers',
            key: 'id',
        },
    },
    paid_for_this_month: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    parents_phone_number: sequelize_1.DataTypes.STRING,
    telegram_user_id: {
        type: sequelize_1.DataTypes.BIGINT,
        unique: true,
    },
    came_in_school: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    img_url: sequelize_1.DataTypes.STRING,
    left_school: sequelize_1.DataTypes.DATE,
}, {
    sequelize: database_config_1.default,
    tableName: 'students',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
exports.default = Student;
