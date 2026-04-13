import React from 'react';
import { Activity, ShieldAlert, Settings, LayoutDashboard, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import LiveTraffic from './pages/LiveTraffic';
import SettingsView from './pages/SettingsView';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const { user, loading, login, logout, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="center">Loading...</div>;
  }

  if (!isAuthenticated()) {
    return <Login onLogin={login} />;
  }

  let currentView;
  if (activeTab === 'dashboard') {
    currentView = <Dashboard />;
  } else if (activeTab === 'live') {
    currentView = <LiveTraffic />;
  } else if (activeTab === 'settings') {
    currentView = <SettingsView />;
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <ShieldAlert size={32} className="logo-icon" />
          <span className="logo-text">CyberPulse</span>
        </div>
        
        <nav className="nav-menu">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Activity size={20} />
            <span>Live Traffic</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            <span>Settings</span>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <h1 className="page-title">
            {activeTab === 'dashboard' && 'Network Analytics'}
            {activeTab === 'live' && 'Real-Time Packet Logs'}
            {activeTab === 'settings' && 'System Settings'}
          </h1>
          <div className="header-actions">
            <div className="flex items-center gap-2">
              <span className="live-indicator"></span>
              <span style={{ color: 'var(--status-danger)', fontWeight: 500 }}>Live Monitoring Active</span>
            </div>
            <div className="user-info">
              <span style={{ color: '#f0f6fc', marginRight: '1rem' }}>{user?.username}</span>
              <button onClick={logout} className="logout-button" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {currentView}
      </main>
    </div>
  );
}

export default App;
