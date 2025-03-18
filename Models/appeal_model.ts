import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database.config";

class Appeal extends Model {}
Appeal.init({
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
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  telegram_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  is_seen: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  is_answered: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  tableName: 'appeals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Appeal