import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.config";

interface NoteAttributes {
  id: string;
  title: string;
  description: string;
  date: string;
  branch_id: string;
}

interface NoteCreationAttributes extends Optional<NoteAttributes, "id"> {}

export class Note extends Model<NoteAttributes, NoteCreationAttributes> implements NoteAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public date!: string; 
  public branch_id!: string;
}

Note.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
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
    tableName: "notes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Note;
