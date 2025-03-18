import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database.config";

class Group extends Model {}
Group.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
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
  },
  teacher_phone: DataTypes.STRING,
  students_amount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  paid_students_amount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
}, {
  sequelize,
  tableName: 'groups',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Group.sync({ force: false });

export default Group