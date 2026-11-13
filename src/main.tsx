import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
);
