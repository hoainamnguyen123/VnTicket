import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, SearchOutlined, HistoryOutlined, UserOutlined } from '@ant-design/icons';
import { Grid } from 'antd';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const { useBreakpoint } = Grid;

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const screens = useBreakpoint();
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);

    // Chỉ hiển thị trên mobile
    if (screens.md) return null;

    const navItems = [
        {
            key: '/',
            icon: <HomeOutlined />,
            label: t('navbar.home', 'Trang chủ'),
        },
        {
            key: '/events',
            icon: <SearchOutlined />,
            label: t('home.searchPlaceholder', 'Tìm kiếm').split(' ')[0], // Get first word
        },
        {
            key: '/history',
            icon: <HistoryOutlined />,
            label: t('navbar.myTickets', 'Vé của tôi'),
        },
        {
            key: '/profile',
            icon: <UserOutlined />,
            label: t('navbar.profile', 'Cá nhân'),
        },
    ];

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70px',
            background: isDark ? 'rgba(31, 31, 31, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 1001,
            paddingBottom: 'env(safe-area-inset-bottom)', // Hỗ trợ iPhone notch dưới
            boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}>
            {navItems.map((item) => {
                const isActive = location.pathname === item.key;
                return (
                    <div
                        key={item.key}
                        onClick={() => navigate(item.key)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            cursor: 'pointer',
                            color: isActive ? '#1890ff' : (isDark ? '#888' : '#666'),
                            transition: 'all 0.3s ease',
                            padding: '8px 0'
                        }}
                    >
                        <div style={{ 
                            fontSize: '22px', 
                            marginBottom: '4px',
                            transform: isActive ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}>
                            {item.icon}
                        </div>
                        <span style={{ 
                            fontSize: '11px', 
                            fontWeight: isActive ? 'bold' : '500',
                            maxWidth: '70px',
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {item.label}
                        </span>
                        {isActive && (
                            <div style={{
                                position: 'absolute',
                                bottom: '6px',
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: '#1890ff'
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default BottomNav;
