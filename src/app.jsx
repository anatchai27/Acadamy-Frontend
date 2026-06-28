import { Router } from 'preact-router';
import { IndexPage } from './pages/index';
import { LoginPage, RegisterPage, ForgotPasswordPage, ContactPage } from './features/auth';
import { DashboardPage, UsersPage, CoursesPage, SessionsPage, RequestsPage, AcademicsPage, SettingsPage, StudentsPage, StudentAddPage, StudentProfilePage, AttendancePage, FinancePage, TeachersPage } from './pages/admin';
import { ToastContainer, ConfirmDialogContainer } from './components/ui';
import './app.css';

export function App() {
  return (
    <>
      <Router>
        <LoginPage path="/" />
        <LoginPage path="/login" />
        <RegisterPage path="/register" />
        <ForgotPasswordPage path="/forgot-password" />
        <ContactPage path="/contact" />
        <DashboardPage path="/admin/dashboard" />
        <StudentsPage path="/admin/students" />
        <StudentAddPage path="/admin/students/add" />
        <StudentProfilePage path="/admin/students/:id" />
        <TeachersPage path="/admin/teachers" />
        <CoursesPage path="/admin/courses" />
        <SessionsPage path="/admin/courses/:courseId/sessions" />
        <AttendancePage path="/admin/attendance" />
        <RequestsPage path="/admin/requests" />
        <AcademicsPage path="/admin/academics" />
        <FinancePage path="/admin/finance" />
        <UsersPage path="/admin/users" />
        <SettingsPage path="/admin/settings" />
      </Router>
      <ToastContainer />
      <ConfirmDialogContainer />
    </>
  );
}
