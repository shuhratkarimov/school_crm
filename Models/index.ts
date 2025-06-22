import Appeal from './appeal_model';
import Group from './group_model';
import Payment from './payment_model';
import Student from './student_model';
import Teacher from './teacher_model';
import Attendance from './attendance_model';
import User from './user_model';
import Center from './center_model';
import Notification from './notification_model';
import NotificationToCenter from './notification_center.model';
import Schedule from './schedule_model';
import Room from './room_model';
import StudentGroup from './student_groups_model';

// Bog‘lanishlar
// 1. Teacher ↔ Group
Teacher.hasMany(Group, {
  foreignKey: 'teacher_id',
  as: 'groups',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Group.belongsTo(Teacher, {
  foreignKey: 'teacher_id',
  as: 'teacher',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

Room.hasMany(Group, {
  foreignKey: 'room_id',
  as: 'groups',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Group.belongsTo(Room, {
  foreignKey: 'room_id',
  as: 'room',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// 2. Group ↔ Student (Many-to-Many)
Group.belongsToMany(Student, {
  through: 'student_groups',
  foreignKey: 'group_id',
  otherKey: 'student_id',
  as: 'students',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Student.belongsToMany(Group, {
  through: 'student_groups',
  foreignKey: 'student_id',
  otherKey: 'group_id',
  as: 'groups',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// 3. Teacher ↔ Student
Teacher.hasMany(Student, {
  foreignKey: 'teacher_id',
  as: 'students',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Student.belongsTo(Teacher, {
  foreignKey: 'teacher_id',
  as: 'teacher',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// 4. Student ↔ Payment
Student.hasMany(Payment, {
  foreignKey: 'pupil_id',
  as: 'payments',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Payment.belongsTo(Student, {
  foreignKey: 'pupil_id',
  as: 'student',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// 5. Student ↔ Appeal
Student.hasMany(Appeal, {
  foreignKey: 'pupil_id',
  as: 'appeals',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Appeal.belongsTo(Student, {
  foreignKey: 'pupil_id',
  as: 'student',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// 6. Group ↔ Attendance
Group.hasMany(Attendance, {
  foreignKey: 'group_id',
  as: 'attendances',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Attendance.belongsTo(Group, {
  foreignKey: 'group_id',
  as: 'group',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// 7. Student ↔ Notification
Student.hasMany(Notification, {
  foreignKey: 'pupil_id',
  as: 'notifications',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Notification.belongsTo(Student, {
  foreignKey: 'pupil_id',
  as: 'student',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// 8. Center ↔ NotificationToCenter
Center.hasMany(NotificationToCenter, {
  foreignKey: 'center_id',
  as: 'notifications',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
NotificationToCenter.belongsTo(Center, {
  foreignKey: 'center_id',
  as: 'center',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// Aloqalar
Room.hasMany(Schedule, {
  foreignKey: 'room_id',
  as: 'roomSchedules',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Schedule.belongsTo(Room, {
  foreignKey: 'room_id',
  as: 'room',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Group.hasMany(Schedule, {
  foreignKey: 'group_id',
  as: 'groupSchedules',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Schedule.belongsTo(Group, {
  foreignKey: 'group_id',
  as: 'group',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Teacher.hasMany(Schedule, {
  foreignKey: 'teacher_id',
  as: 'teacherSchedules',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Schedule.belongsTo(Teacher, {
  foreignKey: 'teacher_id',
  as: 'teacher',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Student modeli bilan StudentGroup o'rtasidagi bog'lanish
Student.hasMany(StudentGroup, {
  foreignKey: 'student_id', // StudentGroup jadvalidagi student_id maydoni
  as: 'studentGroups',     // Alias nomi
  onDelete: 'SET NULL',    // O'quvchi o'chirilsa, bog'lanish NULL bo'ladi
  onUpdate: 'CASCADE',     // O'quvchi ID o'zgartirilsa, yangilanadi
});

// StudentGroup modeli bilan Student o'rtasidagi bog'lanish
StudentGroup.belongsTo(Student, {
  foreignKey: 'student_id', // StudentGroup jadvalidagi student_id maydoni
  as: 'student',           // Alias nomi (Student uchun)
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Group modeli bilan StudentGroup o'rtasidagi bog'lanish
Group.hasMany(StudentGroup, {
  foreignKey: 'group_id',  // StudentGroup jadvalidagi group_id maydoni
  as: 'studentGroups',     // Alias nomi
  onDelete: 'SET NULL',   // Guruh o'chirilsa, bog'lanish NULL bo'ladi
  onUpdate: 'CASCADE',    // Guruh ID o'zgartirilsa, yangilanadi
});

// StudentGroup modeli bilan Group o'rtasidagi bog'lanish
StudentGroup.belongsTo(Group, {
  foreignKey: 'group_id',  // StudentGroup jadvalidagi group_id maydoni
  as: 'group',            // Alias nomi (Group uchun)
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

export {
  Teacher,
  Group,
  Student,
  Payment,
  Appeal,
  Attendance,
  User,
  Center,
  Notification,
  NotificationToCenter,
  Room,
  Schedule,
};