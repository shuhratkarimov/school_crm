import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.config";

class UserNotification extends Model { }

UserNotification.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },

        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "info", // success | warning | danger | info
        },

        is_read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: null,
        },

        event_key: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        event_unique_key: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: "user_notifications",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default UserNotification;