import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database.config";

class Student extends Model {}
Student.init({
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
  father_name: DataTypes.STRING,
  mother_name: DataTypes.STRING,
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  phone_number: DataTypes.STRING,
  group_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'groups',
      key: 'id',
    },
  },
  teacher_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'teachers',
      key: 'id',
    },
  },
  paid_for_this_month: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  parents_phone_number: DataTypes.STRING,
  telegram_user_id: {
    type: DataTypes.BIGINT,
    unique: true,
  },
  came_in_school: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  img_url: DataTypes.STRING,
  left_school: DataTypes.DATE,
}, {
  sequelize,
  tableName: 'students',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Student;