import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';
import KnowledgeBase from './components/KnowledgeBase';
import UserProfilePage from './components/UserProfile';
import DataAnalytics from './components/DataAnalytics';
import AssessmentPage from './components/AssessmentPage';
import LoginPage from './components/LoginPage';
import EmotionDashboard from './components/EmotionDashboard';
import CrisisCenter from './components/CrisisCenter';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Auth Context
const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} onLogout={logout} />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<ChatInterface />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/analytics" element={<DataAnalytics />} />
              <Route path="/assessment" element={<AssessmentPage />} />
              <Route path="/emotions" element={<EmotionDashboard />} />
              <Route path="/crisis" element={<CrisisCenter />} />
            </Routes>
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
