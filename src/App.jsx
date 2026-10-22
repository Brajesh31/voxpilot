import { lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from '@/store';
import { hasApiKey } from '@/utils/apiKeyManager';
import AppLayout from '@/components/layout/AppLayout';
import ApiKeySetup from '@/components/ApiKeySetup';
import ApiKeyValidator from '@/components/ApiKeyValidator';
import { Toaster } from 'sonner';
import '@/styles/theme.css';

// Lazy-load route views for code splitting and instant initial page load
const OverviewPage = lazy(() => import('@/pages/OverviewPage'));
const AgentsPage = lazy(() => import('@/pages/AgentsPage'));
const AgentWorkspacePage = lazy(() => import('@/pages/AgentWorkspacePage'));
const CallsPage = lazy(() => import('@/pages/CallsPage'));
const PhoneNumbersPage = lazy(() => import('@/pages/PhoneNumbersPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function PageFallback() {
  return (
    <div 
      className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center" 
      role="status" 
      aria-live="polite"
    >
      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
      <span className="text-xs text-muted-foreground font-medium">Loading VoxPilot workspace...</span>
    </div>
  );
}

export default function App() {
  // If no API key configured, prompt immediate setup
  if (!hasApiKey()) {
    return (
      <Provider store={store}>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <ApiKeySetup />
        </div>
        <Toaster position="top-right" richColors />
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <ApiKeyValidator>
        <HashRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="agents" element={<AgentsPage />} />
                <Route path="agents/:id" element={<AgentWorkspacePage />} />
                <Route path="agents/:id/test" element={<AgentWorkspacePage defaultTab="test" />} />
                <Route path="calls" element={<CallsPage />} />
                <Route path="phone-numbers" element={<PhoneNumbersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </HashRouter>
        <Toaster position="top-right" richColors />
      </ApiKeyValidator>
    </Provider>
  );
}