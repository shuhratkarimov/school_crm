import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.config";

class Feedback extends Model { }

Feedback.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },
        type: {
            type: DataTypes.ENUM("feedback", "bug"),
            allowNull: false,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("new", "reviewed", "resolved"),
            allowNull: false,
            defaultValue: "new",
        },
        sender_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        sender_type: {
            type: DataTypes.ENUM("user", "teacher"),
            allowNull: false,
        },
        branch_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "branches",
                key: "id",
            },
        },
    },
    {
        sequelize,
        tableName: "feedbacks",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default Feedback;