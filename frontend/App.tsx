import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import { Background } from './components/layout/Background';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { NewTradePanel } from './components/panels/NewTradePanel';
import { ImportModal } from './components/modals/ImportModal';
import { ManageAccountsModal } from './components/modals/ManageAccountsModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Journal } from './pages/Journal';
import { Trades } from './pages/Trades';
import { Analytics } from './pages/Analytics';
import { TradeDetail } from './pages/TradeDetail';
import { Settings } from './pages/Settings';

// Placeholder pages for completeness
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full text-text-3 text-xl font-semibold">{title} - Coming Soon</div>
);

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="flex min-h-screen bg-bg-0 text-text-1 selection:bg-em/30">
          <Background />
          <Sidebar />
          
          <div className="ml-[224px] flex flex-col flex-1 min-h-screen relative z-10">
            <Topbar />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/trades" element={<Trades />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/trade/:id" element={<TradeDetail />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Placeholders for requested routes to ensure no dead links */}
                <Route path="/playbook" element={<Placeholder title="Playbook" />} />
                <Route path="/setups" element={<Placeholder title="Setups" />} />
                <Route path="/calendar" element={<Placeholder title="Calendar" />} />
                <Route path="/reports" element={<Placeholder title="Reports" />} />
                <Route path="/goals" element={<Placeholder title="Goals" />} />
              </Routes>
            </main>
          </div>
        </div>

        <NewTradePanel />
        <ImportModal />
        <ManageAccountsModal />
        
        <Toaster 
          position="bottom-right" 
          toastOptions={{ 
            style: { 
              background: '#0C0C0E', 
              color: '#F0F0F0', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '12px',
              fontSize: '14px'
            },
            success: {
              iconTheme: { primary: '#00FFB2', secondary: '#0C0C0E' },
              style: { border: '1px solid rgba(0,255,178,0.3)' }
            },
            error: {
              iconTheme: { primary: '#FF5A5A', secondary: '#0C0C0E' },
              style: { border: '1px solid rgba(255,90,90,0.3)' }
            }
          }} 
        />
      </Router>
    </AppProvider>
  );
}
