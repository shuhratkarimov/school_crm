import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.config";

class Center extends Model { }

Center.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },

    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    owner: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    login: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },

    paymentDate: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM("blocked", "active"), allowNull: true },

    director_id: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    tableName: "centers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Center;