"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class TeacherPayment extends sequelize_1.Model {
}
TeacherPayment.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    teacher_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: "teachers",
            key: "id",
        },
    },
    payment_type: {
        type: sequelize_1.DataTypes.ENUM("avans", "hisob"),
        allowNull: false,
    },
    given_by: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    payment_amount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    given_date: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_config_1.default,
    modelName: "TeacherPayment",
    tableName: "teacher_payments",
    timestamps: false,
});
exports.default = TeacherPayment;
