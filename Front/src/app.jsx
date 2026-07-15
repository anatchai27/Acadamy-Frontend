import { Router } from 'preact-router';
import { IndexPage } from './pages/index';
import { LoginPage, RegisterPage, ForgotPasswordPage, ContactPage } from './features/auth';
import { DashboardPage, UsersPage, CoursesPage, SessionsPage, RequestsPage, AcademicsPage, SettingsPage, StudentsPage, StudentAddPage, StudentProfilePage, AttendancePage, FinancePage, TeachersPage, ProductsPage } from './pages/admin';
import { ToastContainer, ConfirmDialogContainer } from './components/ui';
import { requireAuth } from './components/require-auth';
import './app.css';

const AdminDashboard = requireAuth(DashboardPage);
const AdminStudents = requireAuth(StudentsPage);
const AdminStudentAdd = requireAuth(StudentAddPage);
const AdminStudentProfile = requireAuth(StudentProfilePage);
const AdminTeachers = requireAuth(TeachersPage);
const AdminCourses = requireAuth(CoursesPage);
const AdminSessions = requireAuth(SessionsPage);
const AdminAttendance = requireAuth(AttendancePage);
const AdminRequests = requireAuth(RequestsPage);
const AdminAcademics = requireAuth(AcademicsPage);
const AdminFinance = requireAuth(FinancePage);
const AdminUsers = requireAuth(UsersPage);
const AdminSettings = requireAuth(SettingsPage);
const AdminProducts = requireAuth(ProductsPage);

export function App() {
  return (
    <>
      <Router>
        <LoginPage path="/" />
        <LoginPage path="/login" />
        <RegisterPage path="/register" />
        <ForgotPasswordPage path="/forgot-password" />
        <ContactPage path="/contact" />
        <AdminDashboard path="/admin/dashboard" />
        <AdminStudents path="/admin/students" />
        <AdminStudentAdd path="/admin/students/add" />
        <AdminStudentProfile path="/admin/students/:id" />
        <AdminTeachers path="/admin/teachers" />
        <AdminCourses path="/admin/courses" />
        <AdminSessions path="/admin/courses/:courseId/sessions" />
        <AdminAttendance path="/admin/attendance" />
        <AdminRequests path="/admin/requests" />
        <AdminAcademics path="/admin/academics" />
        <AdminFinance path="/admin/finance" />
        <AdminUsers path="/admin/users" />
        <AdminSettings path="/admin/settings" />
        <AdminProducts path="/admin/products" />
      </Router>
      <ToastContainer />
      <ConfirmDialogContainer />
    </>
  );
}
