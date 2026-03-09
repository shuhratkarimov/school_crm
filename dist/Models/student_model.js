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
        defaultValue: sequelize_1.DataTypes.UUIDV4, // gen_random_uuid() ga mos
    },
    first_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    last_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    father_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    mother_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    birth_date: {
        type: sequelize_1.DataTypes.DATEONLY, // faqat sana, vaqt yo'q
        allowNull: false,
    },
    phone_number: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    parents_phone_number: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    telegram_user_id: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true
    },
    came_in_school: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    img_url: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    left_school: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    studental_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    branch_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'branches',
            key: 'id',
        },
    },
}, {
    sequelize: database_config_1.default,
    tableName: 'students',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
exports.default = Student;
