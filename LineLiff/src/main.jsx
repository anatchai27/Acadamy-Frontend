import { render } from 'preact';
import { App } from './app';
import { LiffProvider } from './store/LiffContext';
import './index.css';

render(
  <LiffProvider>
    <App />
  </LiffProvider>,
  document.getElementById('app')
);