import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

class Payment extends Model {}
Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    pupil_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'students',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'groups',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    payment_amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    payment_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    received: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    for_which_month: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    for_which_group: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

Payment.sync({force: false})

export default Payment;