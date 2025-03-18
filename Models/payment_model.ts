import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database.config";

class Payment extends Model {}
Payment.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  pupil_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id',
    },
  },
  payment_amount: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
}, {
  sequelize,
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Payment