import { Router } from 'preact-router';
import { useLiffContext } from './store/LiffContext';
import { SplashPage } from './pages/splash';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { AttendancePage } from './pages/attendance';
import { PaymentsPage } from './pages/payments';
import { ProfilePage } from './pages/profile';

export const App = () => {
  const { state } = useLiffContext();

  return state.loading ? <SplashPage /> : (
    <div class="min-h-screen bg-gray-50 text-gray-900">
      <Router>
        <LoginPage path="/liff" />
        <LoginPage path="/liff/login" />
        <DashboardPage path="/liff/dashboard" />
        <AttendancePage path="/liff/attendance/:childId" />
        <PaymentsPage path="/liff/payments/:childId" />
        <ProfilePage path="/liff/profile" />
      </Router>
    </div>
  );
};
