import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

export class RegistrationLink extends Model {}

RegistrationLink.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'registration_links',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);