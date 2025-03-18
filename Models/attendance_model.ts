import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database.config";

class Attendance extends Model {}
Attendance.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  group_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'groups',
      key: 'id',
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, 
  },
  came_students: {
    type: DataTypes.JSONB,
    allowNull: false
  },
}, {
  sequelize,
  tableName: 'attendances',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Attendance.sync({force: false})

export default Attendance