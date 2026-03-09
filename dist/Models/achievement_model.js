"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
const Achievement = database_config_1.default.define("Achievement", {
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    achiever_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    achiever_type: {
        type: sequelize_1.DataTypes.ENUM("student", "teacher"),
        allowNull: false,
    },
    achievement_title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    date: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    branch_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
}, {
    tableName: "achievements",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
exports.default = Achievement;
