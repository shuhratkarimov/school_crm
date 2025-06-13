"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class Center extends sequelize_1.Model {
}
Center.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    owner: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    login: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    paymentDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: "1990-01-01",
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("active", "blocked"),
        allowNull: false,
        defaultValue: "blocked"
    },
}, {
    sequelize: database_config_1.default,
    tableName: "centers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
Center.sync({ force: false });
exports.default = Center;
