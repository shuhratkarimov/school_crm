import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

class Student extends Model {}

Student.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4, // gen_random_uuid() ga mos
    },
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    father_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mother_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    birth_date: {
      type: DataTypes.DATEONLY, // faqat sana, vaqt yo'q
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    paid_groups: {
      type: DataTypes.INTEGER
    },
    total_groups: {
      type: DataTypes.INTEGER
    },
    parents_phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    telegram_user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true,
    },
    came_in_school: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    img_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    left_school: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    studental_id: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'students',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

Student.sync({force: false})

export default Student;
