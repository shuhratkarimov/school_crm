"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformReview = void 0;
const sequelize_1 = require("sequelize");
const database_config_1 = __importDefault(require("../config/database.config"));
class PlatformReview extends sequelize_1.Model {
}
exports.PlatformReview = PlatformReview;
PlatformReview.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    actor_type: {
        type: sequelize_1.DataTypes.ENUM('teacher', 'user'),
        allowNull: false,
    },
    actor_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    rating: {
        type: sequelize_1.DataTypes.DECIMAL(2, 1),
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
        },
    },
    comment: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_config_1.default,
    tableName: 'platform_reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['actor_type', 'actor_id'] },
        { unique: true, fields: ['actor_type', 'actor_id'] },
    ],
});
