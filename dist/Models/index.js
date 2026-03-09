"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettings = exports.UserNotification = exports.TeacherBalance = exports.Achievement = exports.TeacherPayment = exports.RegistrationLink = exports.NewStudent = exports.Note = exports.Expense = exports.Branch = exports.TestResult = exports.Test = exports.StudentGroup = exports.Schedule = exports.Room = exports.NotificationToCenter = exports.Notification = exports.Center = exports.User = exports.AttendanceRecord = exports.Attendance = exports.Appeal = exports.Payment = exports.Student = exports.Group = exports.Teacher = void 0;
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
const attendance_model_1 = require("./attendance_model"); // ✅ NAMED import
Object.defineProperty(exports, "Attendance", { enumerable: true, get: function () { return attendance_model_1.Attendance; } });
Object.defineProperty(exports, "AttendanceRecord", { enumerable: true, get: function () { return attendance_model_1.AttendanceRecord; } });
const user_model_1 = require("./user_model");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_model_1.User; } });
const center_model_1 = __importDefault(require("./center_model"));
exports.Center = center_model_1.default;
const notification_model_1 = __importDefault(require("./notification_model"));
exports.Notification = notification_model_1.default;
const notification_center_model_1 = __importDefault(require("./notification_center.model"));
exports.NotificationToCenter = notification_center_model_1.default;
const schedule_model_1 = __importDefault(require("./schedule_model"));
exports.Schedule = schedule_model_1.default;
const room_model_1 = __importDefault(require("./room_model"));
exports.Room = room_model_1.default;
const student_groups_model_1 = __importDefault(require("./student_groups_model"));
exports.StudentGroup = student_groups_model_1.default;
const achievement_model_1 = __importDefault(require("./achievement_model"));
exports.Achievement = achievement_model_1.default;
const test_model_1 = __importDefault(require("./test_model"));
exports.Test = test_model_1.default;
const test_result_model_1 = __importDefault(require("./test_result_model"));
exports.TestResult = test_result_model_1.default;
const teacher_payment_model_1 = __importDefault(require("./teacher-payment.model"));
exports.TeacherPayment = teacher_payment_model_1.default;
const branches_model_1 = __importDefault(require("./branches_model"));
exports.Branch = branches_model_1.default;
const expense_model_1 = __importDefault(require("./expense_model"));
exports.Expense = expense_model_1.default;
const note_model_1 = __importDefault(require("./note_model"));
exports.Note = note_model_1.default;
const newstudent_model_1 = __importDefault(require("./newstudent_model"));
exports.NewStudent = newstudent_model_1.default;
const registration_link_model_1 = __importDefault(require("./registration_link_model"));
exports.RegistrationLink = registration_link_model_1.default;
const teacher_balance_model_1 = __importDefault(require("./teacher-balance.model"));
exports.TeacherBalance = teacher_balance_model_1.default;
const user_settings_model_1 = __importDefault(require("./user_settings.model"));
exports.UserSettings = user_settings_model_1.default;
const user_notification_model_1 = __importDefault(require("./user_notification_model"));
exports.UserNotification = user_notification_model_1.default;
// 1. Teacher ↔ Group
teacher_model_1.default.hasMany(group_model_1.default, {
    foreignKey: "teacher_id",
    as: "groups",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
group_model_1.default.belongsTo(teacher_model_1.default, {
    foreignKey: "teacher_id",
    as: "teacher",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
// Room ↔ Group
room_model_1.default.hasMany(group_model_1.default, {
    foreignKey: "room_id",
    as: "groups",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
});
group_model_1.default.belongsTo(room_model_1.default, {
    foreignKey: "room_id",
    as: "room",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
});
// 2. Group ↔ Student (Many-to-Many)
group_model_1.default.belongsToMany(student_model_1.default, {
    through: "student_groups",
    foreignKey: "group_id",
    otherKey: "student_id",
    as: "students",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
student_model_1.default.belongsToMany(group_model_1.default, {
    through: "student_groups",
    foreignKey: "student_id",
    otherKey: "group_id",
    as: "groups",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
student_model_1.default.hasMany(achievement_model_1.default, {
    foreignKey: "achiever_id",
    constraints: false,
    scope: { achiever_type: "student" },
    as: "achievements",
});
teacher_model_1.default.hasMany(achievement_model_1.default, {
    foreignKey: "achiever_id",
    constraints: false,
    scope: { achiever_type: "teacher" },
    as: "achievements",
});
achievement_model_1.default.belongsTo(student_model_1.default, {
    foreignKey: "achiever_id",
    constraints: false,
    as: "student",
});
achievement_model_1.default.belongsTo(teacher_model_1.default, {
    foreignKey: "achiever_id",
    constraints: false,
    as: "teacher",
});
// 4. Student ↔ Payment
student_model_1.default.hasMany(payment_model_1.default, { foreignKey: "pupil_id", as: "studentPayments" });
payment_model_1.default.belongsTo(student_model_1.default, { foreignKey: "pupil_id", as: "student" });
// 5. Student ↔ Appeal
// Student -> Appeals
student_model_1.default.hasMany(appeal_model_1.default, {
    foreignKey: "pupil_id",
    as: "appeals",
});
appeal_model_1.default.belongsTo(student_model_1.default, {
    foreignKey: "pupil_id",
    as: "student",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
});
// 6. Group ↔ Attendance
group_model_1.default.hasMany(attendance_model_1.Attendance, {
    foreignKey: "group_id",
    as: "attendances",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
attendance_model_1.Attendance.belongsTo(group_model_1.default, {
    foreignKey: "group_id",
    as: "group",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
// ✅ 6.1 Attendance ↔ AttendanceRecord
attendance_model_1.Attendance.hasMany(attendance_model_1.AttendanceRecord, {
    foreignKey: "attendance_id",
    as: "records",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
attendance_model_1.AttendanceRecord.belongsTo(attendance_model_1.Attendance, {
    foreignKey: "attendance_id",
    as: "attendance",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
teacher_model_1.default.hasMany(teacher_payment_model_1.default, {
    foreignKey: "teacher_id",
    as: "payments", // bu alias orqali chaqiriladi
    onDelete: "CASCADE",
});
// Har bir payment faqat bitta teacherga tegishli
teacher_payment_model_1.default.belongsTo(teacher_model_1.default, {
    foreignKey: "teacher_id",
    as: "teacher", // bu alias bilan include da ishlatiladi
});
teacher_model_1.default.hasMany(teacher_balance_model_1.default, {
    foreignKey: "teacher_id",
    as: "teacherBalance",
    onDelete: "CASCADE",
});
teacher_balance_model_1.default.belongsTo(teacher_model_1.default, {
    foreignKey: "teacher_id",
    as: "teacher",
});
group_model_1.default.hasMany(payment_model_1.default, { foreignKey: "group_id", as: "groupPayments" });
payment_model_1.default.belongsTo(group_model_1.default, { foreignKey: "group_id", as: "paymentGroup" });
// ✅ 6.2 Student ↔ AttendanceRecord
student_model_1.default.hasMany(attendance_model_1.AttendanceRecord, {
    foreignKey: "student_id",
    as: "attendanceRecords",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
attendance_model_1.AttendanceRecord.belongsTo(student_model_1.default, {
    foreignKey: "student_id",
    as: "student",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
// 7. Student ↔ Notification
student_model_1.default.hasMany(notification_model_1.default, {
    foreignKey: "pupil_id",
    as: "notifications",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
notification_model_1.default.belongsTo(student_model_1.default, {
    foreignKey: "pupil_id",
    as: "student",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
// 8. Center ↔ NotificationToCenter
center_model_1.default.hasMany(notification_center_model_1.default, {
    foreignKey: "center_id",
    as: "notifications",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
notification_center_model_1.default.belongsTo(center_model_1.default, {
    foreignKey: "center_id",
    as: "center",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
// Room / Schedule / Group / Teacher
room_model_1.default.hasMany(schedule_model_1.default, {
    foreignKey: "room_id",
    as: "roomSchedules",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
schedule_model_1.default.belongsTo(room_model_1.default, {
    foreignKey: "room_id",
    as: "room",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
group_model_1.default.hasMany(schedule_model_1.default, { foreignKey: "group_id", as: "groupSchedules" });
schedule_model_1.default.belongsTo(group_model_1.default, { foreignKey: "group_id", as: "scheduleGroup" });
teacher_model_1.default.hasMany(schedule_model_1.default, {
    foreignKey: "teacher_id",
    as: "teacherSchedules",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
});
schedule_model_1.default.belongsTo(teacher_model_1.default, {
    foreignKey: "teacher_id",
    as: "teacher",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
});
// Student ↔ StudentGroup (helper table)
student_model_1.default.hasMany(student_groups_model_1.default, {
    foreignKey: "student_id",
    as: "studentGroups",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
});
student_groups_model_1.default.belongsTo(student_model_1.default, {
    foreignKey: "student_id",
    as: "student",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
});
user_model_1.User.hasOne(user_settings_model_1.default, {
    foreignKey: "user_id",
    as: "settings",
});
user_settings_model_1.default.belongsTo(user_model_1.User, {
    foreignKey: "user_id",
    as: "user",
});
// StudentGroup ↔ Group
group_model_1.default.hasMany(student_groups_model_1.default, { foreignKey: "group_id", as: "studentGroups" });
student_groups_model_1.default.belongsTo(group_model_1.default, { foreignKey: "group_id", as: "studentGroupParent" });
group_model_1.default.hasMany(test_model_1.default, { foreignKey: "group_id", as: "tests" });
test_model_1.default.belongsTo(group_model_1.default, { foreignKey: "group_id", as: "group" });
test_model_1.default.hasMany(test_result_model_1.default, { foreignKey: "test_id", as: "results", onDelete: "CASCADE" });
test_result_model_1.default.belongsTo(test_model_1.default, { foreignKey: "test_id", as: "test" });
student_model_1.default.hasMany(test_result_model_1.default, { foreignKey: "student_id", as: "test_results" });
test_result_model_1.default.belongsTo(student_model_1.default, { foreignKey: "student_id", as: "student" });
// Branch ↔ Teacher
branches_model_1.default.hasMany(teacher_model_1.default, { foreignKey: 'branch_id', as: 'branchTeachers' });
teacher_model_1.default.belongsTo(branches_model_1.default, { foreignKey: 'branch_id', as: 'branch' });
// Branch ↔ Student
branches_model_1.default.hasMany(student_model_1.default, { foreignKey: 'branch_id', as: 'branchStudents' });
student_model_1.default.belongsTo(branches_model_1.default, { foreignKey: 'branch_id', as: 'branch' });
// Branch ↔ Room
branches_model_1.default.hasMany(room_model_1.default, { foreignKey: 'branch_id', as: 'branchRooms' });
room_model_1.default.belongsTo(branches_model_1.default, { foreignKey: 'branch_id', as: 'branch' });
// Branch ↔ Group
branches_model_1.default.hasMany(group_model_1.default, { foreignKey: 'branch_id', as: 'branchGroups' });
group_model_1.default.belongsTo(branches_model_1.default, { foreignKey: 'branch_id', as: 'branch' });
// Branch ↔ Expense
branches_model_1.default.hasMany(expense_model_1.default, { foreignKey: 'branch_id', as: 'branchExpenses' });
expense_model_1.default.belongsTo(branches_model_1.default, { foreignKey: 'branch_id', as: 'branch' });
// Branch ↔ Note
branches_model_1.default.hasMany(note_model_1.default, { foreignKey: 'branch_id', as: 'branchNotes' });
note_model_1.default.belongsTo(branches_model_1.default, { foreignKey: 'branch_id', as: 'branch' });
// Branch ↔ NewStudent
branches_model_1.default.hasMany(newstudent_model_1.default, { foreignKey: 'branch_id', as: 'branchNewStudents' });
newstudent_model_1.default.belongsTo(branches_model_1.default, { foreignKey: 'branch_id', as: 'branch' });
// Branch ↔ RegistrationLink
branches_model_1.default.hasMany(registration_link_model_1.default, { foreignKey: 'branch_id', as: 'branchRegistrationLinks' });
registration_link_model_1.default.belongsTo(branches_model_1.default, { foreignKey: 'branch_id', as: 'branch' });
center_model_1.default.hasMany(branches_model_1.default, { foreignKey: "center_id", as: "branches" });
branches_model_1.default.belongsTo(center_model_1.default, { foreignKey: "center_id", as: "center" });
center_model_1.default.belongsTo(user_model_1.User, { foreignKey: "director_id", as: "director" });
user_model_1.User.hasMany(center_model_1.default, { foreignKey: "director_id", as: "directedCenters" });
branches_model_1.default.belongsTo(user_model_1.User, { foreignKey: "manager_id", as: "manager" });
user_model_1.User.hasMany(branches_model_1.default, { foreignKey: "manager_id", as: "managedBranches" });
branches_model_1.default.hasMany(user_model_1.User, { foreignKey: "branch_id", as: "users" });
user_model_1.User.belongsTo(branches_model_1.default, { foreignKey: "branch_id", as: "branch" });
user_model_1.User.hasMany(user_notification_model_1.default, {
    foreignKey: "user_id",
    as: "notifications",
});
user_notification_model_1.default.belongsTo(user_model_1.User, {
    foreignKey: "user_id",
    as: "user",
});
