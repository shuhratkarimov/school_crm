import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

class NotificationToCenter extends Model {}
NotificationToCenter.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    center_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'centers',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'notificationsToCenter',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default NotificationToCenter;