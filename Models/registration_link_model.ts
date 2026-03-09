import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

export class RegistrationLink extends Model { }

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
    },
    token: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'registration_links',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default RegistrationLink;
