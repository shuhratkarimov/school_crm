import { DataTypes } from "sequelize";
import sequelize from "../config/database.config";

const Achievement = sequelize.define(
  "Achievement",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    achiever_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    achiever_type: {
      type: DataTypes.ENUM("student", "teacher"),
      allowNull: false,
    },
    achievement_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "achievements",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Achievement;