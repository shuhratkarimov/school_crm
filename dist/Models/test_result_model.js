"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// models/TestResult.ts
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class TestResult extends sequelize_1.Model {
}
TestResult.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    test_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: "tests", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    student_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: "students", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    },
    score: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    attended: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    is_sent: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize: database_config_1.default, modelName: "TestResult", tableName: "test_results", timestamps: false });
exports.default = TestResult;
