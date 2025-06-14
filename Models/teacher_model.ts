import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

class Group extends Model {}
Group.init(
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
    group_subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    days: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teachers',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    monthly_fee: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    students_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    paid_students_amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'groups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Group;