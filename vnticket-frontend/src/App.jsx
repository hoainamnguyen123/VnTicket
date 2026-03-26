import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { ThemeContext } from './context/ThemeContext';
import Navbar from './components/Navbar';
import AppFooter from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetail from './pages/EventDetail';
import History from './pages/History';
import AllEvents from './pages/AllEvents';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import FAQ from './pages/FAQ';
import OperatingRules from './pages/OperatingRules';
import PaymentReturn from './pages/PaymentReturn';
import { Layout } from 'antd';

const { Content } = Layout;

function App() {
  const { isDark } = useContext(ThemeContext);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{
        minHeight: '100vh',
        background: isDark ? '#0a0a0a' : '#f0f2f5',
        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
        transition: 'all 0.3s ease',
      }}>
        <ScrollToTop />
        <Navbar />

        <Content
          className="app-content"
          style={{
            background: isDark ? '#0a0a0a' : '#f5f5f5',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{
            background: isDark ? '#1a1a1a' : '#fff',
            padding: 24,
            minHeight: 380,
            borderRadius: '8px',
            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
            color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
            transition: 'all 0.3s ease',
          }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/events" element={<AllEvents />} />
              <Route path="/history" element={<History />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/operating-rules" element={<OperatingRules />} />
              <Route path="/payment-return" element={<PaymentReturn />} />
            </Routes>
          </div>
        </Content>

        <AppFooter />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
