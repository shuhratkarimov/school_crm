"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class Feedback extends sequelize_1.Model {
}
Feedback.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM("feedback", "bug"),
        allowNull: false,
    },
    subject: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("new", "reviewed", "resolved"),
        allowNull: false,
        defaultValue: "new",
    },
    sender_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    sender_type: {
        type: sequelize_1.DataTypes.ENUM("user", "teacher"),
        allowNull: false,
    },
    branch_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: "branches",
            key: "id",
        },
    },
}, {
    sequelize: database_config_1.default,
    tableName: "feedbacks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
exports.default = Feedback;
