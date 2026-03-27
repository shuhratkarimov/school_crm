import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Model,
} from 'sequelize';
import sequelize from '../config/database.config';

export class PlatformReview extends Model<
  InferAttributes<PlatformReview>,
  InferCreationAttributes<PlatformReview>
> {
  declare id: CreationOptional<string>;
  declare actor_type: 'teacher' | 'user';
  declare actor_id: number;
  declare rating: number;
  declare comment: CreationOptional<string | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

PlatformReview.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    actor_type: {
      type: DataTypes.ENUM('teacher', 'user'),
      allowNull: false,
    },
    actor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'platform_reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['actor_type', 'actor_id'] },
      { unique: true, fields: ['actor_type', 'actor_id'] },
    ],
  }
);