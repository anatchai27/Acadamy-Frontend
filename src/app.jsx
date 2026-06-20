import { Router } from 'preact-router';
import { IndexPage } from './pages/index';
import { LoginPage, RegisterPage, ForgotPasswordPage, ContactPage } from './features/auth';
import { DashboardPage, UsersPage, CoursesPage, SettingsPage, StudentsPage, StudentAddPage, StudentProfilePage, AttendancePage, FinancePage, TeachersPage } from './pages/admin';
import { ToastContainer, ConfirmDialogContainer } from './components/ui';
import './app.css';

export function App() {
  return (
    <>
      <Router>
        {/* <IndexPage path="/" /> */}
        <LoginPage path="/" />
        <LoginPage path="/login" />
        <RegisterPage path="/register" />
        <ForgotPasswordPage path="/forgot-password" />
        <ContactPage path="/contact" />
        <DashboardPage path="/admin/dashboard" />
        <StudentsPage path="/admin/students" />
        <StudentAddPage path="/admin/students/add" />
        <StudentProfilePage path="/admin/students/:id" />
        <AttendancePage path="/admin/attendance" />
        <FinancePage path="/admin/finance" />
        <TeachersPage path="/admin/teachers" />
        <UsersPage path="/admin/users" />
        <CoursesPage path="/admin/courses" />
        <SettingsPage path="/admin/settings" />
      </Router>
      <ToastContainer />
      <ConfirmDialogContainer />
    </>
  );
}
