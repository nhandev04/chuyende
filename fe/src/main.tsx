import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App.tsx';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isValidClerkKey = Boolean(
  PUBLISHABLE_KEY &&
  (PUBLISHABLE_KEY.startsWith('pk_test_') || PUBLISHABLE_KEY.startsWith('pk_live_')) &&
  !PUBLISHABLE_KEY.includes('placeholder') &&
  !PUBLISHABLE_KEY.includes('your_clerk') &&
  PUBLISHABLE_KEY.length > 35
);

class SafeClerkWrapper extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('Clerk initialization fallback active:', msg);
  }
  render() {
    if (this.state.hasError || !isValidClerkKey || !PUBLISHABLE_KEY) {
      return <>{this.props.children}</>;
    }
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        {this.props.children}
      </ClerkProvider>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <SafeClerkWrapper>
        <ThemeProvider>
          <DataProvider>
            <AuthProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </AuthProvider>
          </DataProvider>
        </ThemeProvider>
      </SafeClerkWrapper>
    </ToastProvider>
  </StrictMode>
);
