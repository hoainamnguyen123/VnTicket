import React, { useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ConfigProvider, theme, Alert, Button } from 'antd';
import { ThemeContext } from './context/ThemeContext';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import AppFooter from './components/Footer';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import EventDetail from './pages/EventDetail';
import History from './pages/History';
import AllEvents from './pages/AllEvents';
import Admin from './pages/Admin';
import CreateEvent from './pages/CreateEvent';
import Profile from './pages/Profile';
import EventStats from './pages/EventStats';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import FAQ from './pages/FAQ';
import OperatingRules from './pages/OperatingRules';
import PaymentReturn from './pages/PaymentReturn';
import VerifyEmail from './pages/VerifyEmail';
import VirtualQueue from './components/VirtualQueue';
import { Layout, Grid } from 'antd';

const { Content } = Layout;
const { useBreakpoint } = Grid;

// Tách Component Banner ra để dùng useNavigate
const VerificationBanner = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  if (user && user.emailVerified === false) {
    return (
      <Alert
        message="Tài khoản chưa xác thực email!"
        description="Bạn sẽ không thể đặt vé cho đến khi xác thực email thành công."
        type="warning"
        showIcon
        banner
        action={
          <Button size="small" type="primary" onClick={() => navigate('/verify-email', { state: { email: user.email } })}>
            Xác thực ngay
          </Button>
        }
        style={{ position: 'sticky', top: '70px', zIndex: 999 }}
      />
    );
  }
  return null;
};

function App() {
  const { isDark } = useContext(ThemeContext);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

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
        <VerificationBanner />
        
        {/* Lớp phòng chờ đè nén lên vạn vật (Flash Sale Guard) */}
        <VirtualQueue />

        <Content
          className="app-content"
          style={{
            background: isDark ? '#0a0a0a' : '#f5f5f5',
            transition: 'background 0.3s ease',
            paddingBottom: isMobile ? '70px' : 0, // Tránh bị BottomNav che
          }}
        >
          <div style={{
            background: isDark ? (isMobile ? '#0a0a0a' : '#1a1a1a') : (isMobile ? '#fff' : '#fff'),
            padding: isMobile ? '0' : 24, // Bỏ padding trên mobile cho tràn viền
            minHeight: isMobile ? 'calc(100vh - 140px)' : 380,
            borderRadius: isMobile ? '0' : '8px',
            boxShadow: isMobile ? 'none' : (isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)'),
            color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
            transition: 'all 0.3s ease',
          }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/events" element={<AllEvents />} />
              <Route path="/history" element={<History />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/event-stats/:id" element={<EventStats />} />
              <Route path="/my-events/stats/:id" element={<EventStats />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/operating-rules" element={<OperatingRules />} />
              <Route path="/payment-return" element={<PaymentReturn />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
            </Routes>
          </div>
        </Content>

        <AppFooter />
        <BottomNav />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
