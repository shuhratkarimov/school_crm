import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

class Teacher extends Model {}

Teacher.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    father_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    img_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
  },
  {
    sequelize,
    tableName: 'teachers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Teacher;
