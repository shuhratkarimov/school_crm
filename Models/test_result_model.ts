// models/TestResult.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.config";
import Test from "./test_model";
import Student from "./student_model";

interface TestResultAttributes {
  id: string;
  test_id: string;
  student_id: string;
  score: number;
  attended: boolean;
  is_sent: boolean;
}

interface TestResultCreationAttributes extends Optional<TestResultAttributes, "id" | "attended"> { }

class TestResult extends Model<TestResultAttributes, TestResultCreationAttributes>
  implements TestResultAttributes {
  public id!: string;
  public test_id!: string;
  public student_id!: string;
  public score!: number;
  public attended!: boolean;
  public is_sent!: boolean;
    student: any;
}

TestResult.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    test_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "tests", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "students", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    score: { type: DataTypes.FLOAT, allowNull: false },
    attended: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_sent: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: "TestResult", tableName: "test_results", timestamps: false }
);

sequelize.sync({force: false});

export default TestResult;
