import { DataTypes, Model } from "sequelize";
import sequelize from '../config/database.config';

export class ReserveStudent extends Model { }

ReserveStudent.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    father_name: DataTypes.STRING,
    mother_name: DataTypes.STRING,
    birth_date: DataTypes.DATEONLY,
    phone_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    parents_phone_number: { type: DataTypes.STRING, allowNull: false },
    came_in_school: DataTypes.DATEONLY,
    notes: DataTypes.TEXT,
    status: {
        type: DataTypes.STRING,
        defaultValue: 'new',
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
}, {
    sequelize,
    tableName: 'reserve_students',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})