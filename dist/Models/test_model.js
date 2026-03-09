"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class Test extends sequelize_1.Model {
}
Test.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    group_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: "groups", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    teacher_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: "teachers", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    test_number: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    test_type: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    total_students: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    attended_students: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    average_score: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0.0 },
    date: { type: sequelize_1.DataTypes.DATE, allowNull: false }
}, {
    sequelize: database_config_1.default,
    modelName: "Test",
    tableName: "tests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
exports.default = Test;
