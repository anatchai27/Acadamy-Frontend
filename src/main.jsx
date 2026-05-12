import { render } from 'preact';
import { App } from './app.jsx';
import { AppProvider } from './store/AppContext.jsx';
import './index.css';

render(
  <AppProvider>
    <App />
  </AppProvider>,
  document.getElementById('app')
);
