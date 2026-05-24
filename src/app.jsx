import { Router } from 'preact-router';
import { IndexPage } from './pages/index';
import { LoginPage, RegisterPage, ForgotPasswordPage, ContactPage } from './features/auth';
import { DashboardPage, UsersPage, CoursesPage, SettingsPage } from './pages/admin';
import { ToastContainer } from './components/ui';
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
        <UsersPage path="/admin/users" />
        <CoursesPage path="/admin/courses" />
        <SettingsPage path="/admin/settings" />
      </Router>
      <ToastContainer />
    </>
  );
}
