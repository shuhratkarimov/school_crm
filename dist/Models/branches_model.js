"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_config_1 = __importDefault(require("../config/database.config"));
const sequelize_1 = require("sequelize");
const Branch = database_config_1.default.define("Branch", {
    id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: sequelize_1.DataTypes.UUIDV4 },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    phone: { type: sequelize_1.DataTypes.STRING, allowNull: false }, // ✅ DB’da bor
    address: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    manager_id: { type: sequelize_1.DataTypes.UUID, allowNull: true },
    center_id: { type: sequelize_1.DataTypes.UUID, allowNull: true }, // ✅ yangi
}, {
    tableName: "branches",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
exports.default = Branch;
