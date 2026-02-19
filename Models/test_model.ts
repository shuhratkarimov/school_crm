import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.config";
import { t } from "i18next";

interface TestAttributes {
  id: string;
  group_id: string;
  teacher_id: string;
  test_number: number;
  test_type: string;
  total_students: number;
  attended_students: number;
  average_score: number;
  date: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface TestCreationAttributes
  extends Optional<TestAttributes, "id" | "total_students" | "attended_students" | "average_score" | "created_at" | "updated_at"> { }

class Test extends Model<TestAttributes, TestCreationAttributes> implements TestAttributes {
  public id!: string;
  public group_id!: string;
  public teacher_id!: string;
  public test_number!: number;
  public test_type!: string;
  public total_students!: number;
  public attended_students!: number;
  public average_score!: number;
  public date!: Date;
  public created_at?: Date;
  public updated_at?: Date;
}

Test.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "groups", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "teachers", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    test_number: { type: DataTypes.INTEGER, allowNull: false },
    test_type: { type: DataTypes.STRING, allowNull: false },
    total_students: { type: DataTypes.INTEGER, defaultValue: 0 },
    attended_students: { type: DataTypes.INTEGER, defaultValue: 0 },
    average_score: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    date: { type: DataTypes.DATE, allowNull: false }
  },
  {
    sequelize,
    modelName: "Test",
    tableName: "tests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Test.sync({ force: false });

export default Test;
