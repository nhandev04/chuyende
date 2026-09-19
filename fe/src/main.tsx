import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/Toast'

import React from 'react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isValidClerkKey = Boolean(
  PUBLISHABLE_KEY &&
  (PUBLISHABLE_KEY.startsWith("pk_test_") || PUBLISHABLE_KEY.startsWith("pk_live_")) &&
  !PUBLISHABLE_KEY.includes("placeholder") &&
  !PUBLISHABLE_KEY.includes("your_clerk") &&
  PUBLISHABLE_KEY.length > 35
);

class SafeClerkWrapper extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn("Clerk initialization fallback active:", error?.message || error);
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
        <App />
      </SafeClerkWrapper>
    </ToastProvider>
  </StrictMode>,
)
