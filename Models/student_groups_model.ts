import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

class StudentGroup extends Model {}

StudentGroup.init(
  {
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id',
      },
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id',
      },
    },
    paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    month: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'student_groups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

StudentGroup.sync({force: false})

export default StudentGroup;