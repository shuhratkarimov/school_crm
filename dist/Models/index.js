"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationToCenter = exports.Notification = exports.Center = exports.User = exports.Attendance = exports.Appeal = exports.Payment = exports.Student = exports.Group = exports.Teacher = void 0;
const appeal_model_1 = __importDefault(require("./appeal_model"));
exports.Appeal = appeal_model_1.default;
const group_model_1 = __importDefault(require("./group_model"));
exports.Group = group_model_1.default;
const payment_model_1 = __importDefault(require("./payment_model"));
exports.Payment = payment_model_1.default;
const student_model_1 = __importDefault(require("./student_model"));
exports.Student = student_model_1.default;
const teacher_model_1 = __importDefault(require("./teacher_model"));
exports.Teacher = teacher_model_1.default;
const attendance_model_1 = __importDefault(require("./attendance_model"));
exports.Attendance = attendance_model_1.default;
const user_model_1 = __importDefault(require("./user_model"));
exports.User = user_model_1.default;
const center_model_1 = __importDefault(require("./center_model"));
exports.Center = center_model_1.default;
const notification_model_1 = __importDefault(require("./notification_model"));
exports.Notification = notification_model_1.default;
const notification_center_model_1 = __importDefault(require("./notification_center.model"));
exports.NotificationToCenter = notification_center_model_1.default;
// Bog‘lanishlar
// 1. Teacher ↔ Group
teacher_model_1.default.hasMany(group_model_1.default, {
    foreignKey: 'teacher_id',
    as: 'groups',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});
group_model_1.default.belongsTo(teacher_model_1.default, {
    foreignKey: 'teacher_id',
    as: 'teacher',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});
// 2. Group ↔ Student
group_model_1.default.hasMany(student_model_1.default, {
    foreignKey: 'group_id',
    as: 'students',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});
student_model_1.default.belongsTo(group_model_1.default, {
    foreignKey: 'group_id',
    as: 'group',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});
// 3. Teacher ↔ Student
teacher_model_1.default.hasMany(student_model_1.default, {
    foreignKey: 'teacher_id',
    as: 'students',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});
student_model_1.default.belongsTo(teacher_model_1.default, {
    foreignKey: 'teacher_id',
    as: 'teacher',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});
// 4. Student ↔ Payment
student_model_1.default.hasMany(payment_model_1.default, {
    foreignKey: 'pupil_id',
    as: 'payments',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});
payment_model_1.default.belongsTo(student_model_1.default, {
    foreignKey: 'pupil_id',
    as: 'student',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});
// 5. Student ↔ Appeal
student_model_1.default.hasMany(appeal_model_1.default, {
    foreignKey: 'pupil_id',
    as: 'appeals',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});
appeal_model_1.default.belongsTo(student_model_1.default, {
    foreignKey: 'pupil_id',
    as: 'student',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});
// 6. Group ↔ Attendance
group_model_1.default.hasMany(attendance_model_1.default, {
    foreignKey: 'group_id',
    as: 'attendances',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
attendance_model_1.default.belongsTo(group_model_1.default, {
    foreignKey: 'group_id',
    as: 'group',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
// 7. Student ↔ Notification
student_model_1.default.hasMany(notification_model_1.default, {
    foreignKey: 'pupil_id',
    as: 'notifications',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
notification_model_1.default.belongsTo(student_model_1.default, {
    foreignKey: 'pupil_id',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
// 8. Center ↔ NotificationToCenter
center_model_1.default.hasMany(notification_center_model_1.default, {
    foreignKey: 'center_id',
    as: 'notifications',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
notification_center_model_1.default.belongsTo(center_model_1.default, {
    foreignKey: 'center_id',
    as: 'center',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
