import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.config";

interface ExpenseAttributes {
  id: string;
  title: string;
  amount: number;
  date: string;
}

interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, "id"> {}

export class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
  public id!: string;
  public title!: string;
  public amount!: number;
  public date!: string;
}

Expense.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "expenses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Expense.sync({ force: false });
