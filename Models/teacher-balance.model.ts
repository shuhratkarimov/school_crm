import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.config";

class TeacherBalance extends Model {}

TeacherBalance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "teachers",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "TeacherBalance",
    tableName: "teacher_balances",
    timestamps: false,
  }
);

export default TeacherBalance;
