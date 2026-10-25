import { Router } from 'preact-router';
import { useLiffContext } from './store/LiffContext';
import { SplashPage } from './pages/splash';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { AttendancePage } from './pages/attendance';
import { PaymentsPage } from './pages/payments';
import { ProfilePage } from './pages/profile';
import { LeaveMakeupPage } from './pages/leave-makeup';
import { HomeworkPage } from './pages/homework';
import { ScoresPage } from './pages/scores';
import { CourseMaterialsPage } from './pages/course-materials';

export const App = () => {
  const { state } = useLiffContext();

  return state.loading ? <SplashPage /> : (
    <div class="min-h-screen bg-oasis-50 text-oasis-navy">
      <Router>
        <LoginPage path="/liff" />
        <LoginPage path="/liff/login" />
        <DashboardPage path="/liff/dashboard" />
        <AttendancePage path="/liff/attendance/:childId" />
        <PaymentsPage path="/liff/payments/:childId" />
        <LeaveMakeupPage path="/liff/leave-makeup/:childId" />
        <HomeworkPage path="/liff/homework/:childId" />
        <ScoresPage path="/liff/scores/:childId" />
        <CourseMaterialsPage path="/liff/materials/:childId" />
        <ProfilePage path="/liff/profile" />
      </Router>
    </div>
  );
};
