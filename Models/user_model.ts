import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

enum Role {
  SUPERADMIN = 'superadmin',
  DIRECTOR = 'director',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
  ADMIN = 'admin',
  USER = 'user',
}

class User extends Model { }
User.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(Role.SUPERADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.DIRECTOR, Role.USER),
      allowNull: false,
      defaultValue: Role.USER,
    },
    verification_code: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export {
  User,
  Role
}