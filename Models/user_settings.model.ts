import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.config";

class UserSettings extends Model { }

UserSettings.init(
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
            unique: true,
            references: {
                model: "users", 
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },

        // profile
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },

        // notifications
        email_notifications: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        push_notifications: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        debt_alerts: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        student_registration: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        payment_alerts: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        teacher_attendance: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        daily_report: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        weekly_report: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        // preferences
        language: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "uz",
        },
        theme: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "light", // light | dark
        },
    },
    {
        sequelize,
        tableName: "user_settings",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default UserSettings;