import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.config";

class TeacherPayment extends Model {}

TeacherPayment.init(
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
    },
    payment_type: {
      type: DataTypes.ENUM("avans", "hisob"),
      allowNull: false,
    },
    given_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    given_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "TeacherPayment",
    tableName: "teacher_payments",
    timestamps: false,
  }
);

export default TeacherPayment;