import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

class NewStudent extends Model {}

NewStudent.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    father_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parents_phone_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    came_in_school: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    interviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'new_students',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default NewStudent;