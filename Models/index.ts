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

// 2. Group ↔ Student
Group.hasMany(Student, {
  foreignKey: 'group_id',
  as: 'students',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Student.belongsTo(Group, {
  foreignKey: 'group_id',
  as: 'group',
  onDelete: 'SET NULL',
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

export { Teacher, Group, Student, Payment, Appeal, Attendance, User, Center, Notification, NotificationToCenter };