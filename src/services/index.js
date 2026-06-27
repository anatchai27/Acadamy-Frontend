export { api } from './api';
export { userService, createUser, getUsers, getUserById } from './user-service';
export {
  authService,
  login,
  logout,
  getMe,
  registerInstitute,
  forgetPassword,
  resetPassword,
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
} from './finance-service';
export {
  teacherService,
  getTeachers,
  getTeacherById,
  createTeacher,
} from './teacher-service';
export {
  courseService,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
} from './course-service';
