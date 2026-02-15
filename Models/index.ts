import Appeal from "./appeal_model";
import Group from "./group_model";
import Payment from "./payment_model";
import Student from "./student_model";
import Teacher from "./teacher_model";
import { Attendance, AttendanceRecord } from "./attendance_model"; // ✅ NAMED import
import User from "./user_model";
import Center from "./center_model";
import Notification from "./notification_model";
import NotificationToCenter from "./notification_center.model";
import Schedule from "./schedule_model";
import Room from "./room_model";
import StudentGroup from "./student_groups_model";
import Achievement from "./achievement_model";
import Test from "./test_model";
import TestResult from "./test_result_model";
import TeacherPayment from "./teacher-payment.model";

// 1. Teacher ↔ Group
Teacher.hasMany(Group, {
  foreignKey: "teacher_id",
  as: "groups",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Group.belongsTo(Teacher, {
  foreignKey: "teacher_id",
  as: "teacher",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Room ↔ Group
Room.hasMany(Group, {
  foreignKey: "room_id",
  as: "groups",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Group.belongsTo(Room, {
  foreignKey: "room_id",
  as: "room",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// 2. Group ↔ Student (Many-to-Many)
Group.belongsToMany(Student, {
  through: "student_groups",
  foreignKey: "group_id",
  otherKey: "student_id",
  as: "students",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Student.belongsToMany(Group, {
  through: "student_groups",
  foreignKey: "student_id",
  otherKey: "group_id",
  as: "groups",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Student.hasMany(Achievement, { foreignKey: "achiever_id", constraints: false, scope: { achiever_type: "student" }, onDelete: "CASCADE", onUpdate: "CASCADE" });
Achievement.belongsTo(Student, { foreignKey: "achiever_id", constraints: false, as: "student", onDelete: "CASCADE", onUpdate: "CASCADE" });

Teacher.hasMany(Achievement, { foreignKey: "achiever_id", constraints: false, scope: { achiever_type: "teacher" }, onDelete: "CASCADE", onUpdate: "CASCADE" });
Achievement.belongsTo(Teacher, { foreignKey: "achiever_id", constraints: false, as: "teacher", onDelete: "CASCADE", onUpdate: "CASCADE" });

// 4. Student ↔ Payment
Student.hasMany(Payment, {
  foreignKey: "pupil_id",
  as: "payments",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Payment.belongsTo(Student, {
  foreignKey: "pupil_id",
  as: "student",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// 5. Student ↔ Appeal
Student.hasMany(Appeal, {
  foreignKey: "pupil_id",
  as: "appeals",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Appeal.belongsTo(Student, {
  foreignKey: "pupil_id",
  as: "student",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// 6. Group ↔ Attendance
Group.hasMany(Attendance, {
  foreignKey: "group_id",
  as: "attendances",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Attendance.belongsTo(Group, {
  foreignKey: "group_id",
  as: "group",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// ✅ 6.1 Attendance ↔ AttendanceRecord
Attendance.hasMany(AttendanceRecord, {
  foreignKey: "attendance_id",
  as: "records",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
AttendanceRecord.belongsTo(Attendance, {
  foreignKey: "attendance_id",
  as: "attendance",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Teacher.hasMany(TeacherPayment, {
  foreignKey: "teacher_id",
  as: "payments",           // bu alias orqali chaqiriladi
  onDelete: "CASCADE",
});

// Har bir payment faqat bitta teacherga tegishli
TeacherPayment.belongsTo(Teacher, {
  foreignKey: "teacher_id",
  as: "teacher",            // bu alias bilan include da ishlatiladi
});

// ✅ 6.2 Student ↔ AttendanceRecord
Student.hasMany(AttendanceRecord, {
  foreignKey: "student_id",
  as: "attendanceRecords",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
AttendanceRecord.belongsTo(Student, {
  foreignKey: "student_id",
  as: "student",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Group ↔ Payment (One-to-Many)
Group.hasMany(Payment, {
  foreignKey: "for_which_group",
  as: "payments",           // Group dan Paymentlarni olish uchun alias
  onDelete: "SET NULL",     // yoki "CASCADE" – sizning logikangizga qarab
  onUpdate: "CASCADE",
});

Payment.belongsTo(Group, {
  foreignKey: "for_which_group",
  as: "group",              // Payment dan Groupni olish uchun alias (include da ishlatiladi)
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// 7. Student ↔ Notification
Student.hasMany(Notification, {
  foreignKey: "pupil_id",
  as: "notifications",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Notification.belongsTo(Student, {
  foreignKey: "pupil_id",
  as: "student",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// 8. Center ↔ NotificationToCenter
Center.hasMany(NotificationToCenter, {
  foreignKey: "center_id",
  as: "notifications",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
NotificationToCenter.belongsTo(Center, {
  foreignKey: "center_id",
  as: "center",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Room / Schedule / Group / Teacher
Room.hasMany(Schedule, {
  foreignKey: "room_id",
  as: "roomSchedules",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Schedule.belongsTo(Room, {
  foreignKey: "room_id",
  as: "room",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Group.hasMany(Schedule, {
  foreignKey: "group_id",
  as: "groupSchedules",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Schedule.belongsTo(Group, {
  foreignKey: "group_id",
  as: "group",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Teacher.hasMany(Schedule, {
  foreignKey: "teacher_id",
  as: "teacherSchedules",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Schedule.belongsTo(Teacher, {
  foreignKey: "teacher_id",
  as: "teacher",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// Student ↔ StudentGroup (helper table)
Student.hasMany(StudentGroup, {
  foreignKey: "student_id",
  as: "studentGroups",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
StudentGroup.belongsTo(Student, {
  foreignKey: "student_id",
  as: "student",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Group.hasMany(StudentGroup, {
  foreignKey: "group_id",
  as: "studentGroups",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
StudentGroup.belongsTo(Group, {
  foreignKey: "group_id",
  as: "group",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Group.hasMany(Test, { foreignKey: "group_id", as: "tests" });
Test.belongsTo(Group, { foreignKey: "group_id", as: "group" });

Test.hasMany(TestResult, { foreignKey: "test_id", as: "results", onDelete: "CASCADE" });
TestResult.belongsTo(Test, { foreignKey: "test_id", as: "test" });

Student.hasMany(TestResult, { foreignKey: "student_id", as: "test_results" });
TestResult.belongsTo(Student, { foreignKey: "student_id", as: "student" });

export {
  Teacher,
  Group,
  Student,
  Payment,
  Appeal,
  Attendance,
  AttendanceRecord,
  User,
  Center,
  Notification,
  NotificationToCenter,
  Room,
  Schedule,
  StudentGroup,
  Test,
  TestResult,
};
