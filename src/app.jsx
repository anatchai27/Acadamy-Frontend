import { Router } from 'preact-router';
import { IndexPage } from './pages/index';
import { LoginPage, RegisterPage } from './features/auth';
import './app.css';

export function App() {
  return (
    <Router>
      <IndexPage path="/" />
      <LoginPage path="/login" />
      <RegisterPage path="/register" />
    </Router>
  );
}
