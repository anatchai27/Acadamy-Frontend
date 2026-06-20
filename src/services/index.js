export { api } from './api';
export { userService, createUser } from './user-service';
export {
  authService,
  login,
  logout,
  getMe,
  getStoredToken,
  getStoredUser,
  setAuthStorage,
  clearAuthStorage,
} from './auth-service';
export {
  studentService,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  getStudentQR,
} from './student-service';
export {
  attendanceService,
  scanAttendance,
  getDailyAttendance,
  submitManualAttendance,
} from './attendance-service';
export {
  financeService,
  createPayment,
  getPayments,
  getPaymentById,
  getCourses,
} from './finance-service';
export {
  teacherService,
  getTeachers,
  getTeacherById,
  createTeacher,
} from './teacher-service';
