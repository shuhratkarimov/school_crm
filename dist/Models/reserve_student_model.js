"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReserveStudent = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class ReserveStudent extends sequelize_1.Model {
}
exports.ReserveStudent = ReserveStudent;
ReserveStudent.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    first_name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    last_name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    father_name: sequelize_1.DataTypes.STRING,
    mother_name: sequelize_1.DataTypes.STRING,
    birth_date: sequelize_1.DataTypes.DATEONLY,
    phone_number: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    parents_phone_number: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    came_in_school: sequelize_1.DataTypes.DATEONLY,
    notes: sequelize_1.DataTypes.TEXT,
    status: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'new',
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        allowNull: false,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        allowNull: false,
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
    tableName: 'reserve_students',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
