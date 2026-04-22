import React, { useContext, useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Form, message, Drawer, Grid, Badge } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { UserOutlined, LogoutOutlined, HistoryOutlined, PlusOutlined, MenuOutlined, TagsOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import EventFormModal from './EventFormModal';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';
import axiosClient from '../api/axiosClient';

const { Header } = Layout;
const { useBreakpoint } = Grid;

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const [isEventModalVisible, setIsEventModalVisible] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [eventForm] = Form.useForm();
    const [pendingCount, setPendingCount] = useState(0);
    const [userRejectedCount, setUserRejectedCount] = useState(0);
    const screens = useBreakpoint();
    const isMobile = !screens.lg; // Chuyển sang lg (992px) để bao quát cả iPad/Tablet

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: t('navbar.profile'),
            onClick: () => navigate('/profile'),
        },
        {
            key: 'my-tickets',
            icon: <TagsOutlined />,
            label: t('navbar.myTickets'),
            onClick: () => navigate('/history'),
        },
        {
            key: 'my-events',
            icon: <CalendarOutlined />,
            label: (
                <Badge count={userRejectedCount} offset={[10, 0]} size="small">
                    {t('profile.myEvents', 'Sự kiện của tôi')}
                    <span style={{ paddingRight: 10 }}></span>
                </Badge>
            ),
            onClick: () => navigate('/profile', { state: { activeTab: '3' } }),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: t('navbar.logout'),
            danger: true,
            onClick: handleLogout,
        },
    ];

    useEffect(() => {
        if (user) {
            const fetchUserRejectedCount = async () => {
                try {
                    const res = await axiosClient.get(`/events/my?page=0&size=1000`);
                    if (res.data.content) {
                        const count = res.data.content.filter(e => e.status === 'REJECTED').length;
                        setUserRejectedCount(count);
                    }
                } catch (error) {
                    console.error("Failed to fetch user events for notification", error);
                }
            };
            fetchUserRejectedCount();

            const handleUserEventRead = () => fetchUserRejectedCount();
            window.addEventListener('user-event-read', handleUserEventRead);

            // Admin polling
            let handleStatusChange = null;
            if (user.role === 'ROLE_ADMIN') {
                const fetchPendingCount = async () => {
                    try {
                        const res = await axiosClient.get(`/admin/events?page=0&size=1000`);
                        const count = res.data.content ? res.data.content.filter(e => e.status === 'PENDING').length : 0;
                        setPendingCount(count);
                    } catch (error) {
                        console.error("Failed to fetch pending events count");
                    }
                };
                fetchPendingCount();

                handleStatusChange = () => fetchPendingCount();
                window.addEventListener('event-status-updated', handleStatusChange);
            }

            return () => {
                window.removeEventListener('user-event-read', handleUserEventRead);
                if (handleStatusChange) {
                    window.removeEventListener('event-status-updated', handleStatusChange);
                }
            };
        }
    }, [user]);

    const handleCreateEvent = async () => {
        try {
            const values = await eventForm.validateFields();
            const combinedLocation = [values.detailAddress, values.ward, values.province].filter(Boolean).join(', ');
            const eventData = {
                ...values,
                location: combinedLocation,
                startTime: values.startTime.format('YYYY-MM-DDTHH:mm:ss'),
                additionalImages: values.additionalImages?.map(item => item?.url || item) || [],
                ticketTypes: values.ticketTypes || []
            };

            delete eventData.province;
            delete eventData.ward;
            delete eventData.detailAddress;

            await axiosClient.post('/events/my', eventData);
            message.success(t('navbar.createEventSuccess'));
            setIsEventModalVisible(false);
            eventForm.resetFields();
            if (location.pathname !== '/profile') {
                navigate('/profile');
            } else {
                window.location.reload();
            }
        } catch (error) {
            if (!error.errorFields) message.error(error.response?.data?.message || t('navbar.createEventError'));
        }
    };

    return (
        <Header style={{
            display: 'flex',
            alignItems: 'center',
            background: isDark ? 'rgba(31, 31, 31, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: isMobile ? '0 16px' : '0 50px',
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            height: '70px',
            borderBottom: isDark ? '1px solid #303030' : '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
        }}>
            <div
                className="logo"
                style={{
                    cursor: 'pointer',
                    marginRight: isMobile ? 'auto' : '60px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}
                onClick={() => navigate('/')}
            >
                <div
                    className="logo-icon"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: isMobile ? '36px' : '44px',
                        height: isMobile ? '36px' : '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                        boxShadow: '0 4px 14px rgba(114, 46, 209, 0.4)',
                        transform: 'rotate(-5deg)'
                    }}
                >
                    <span style={{
                        color: 'white',
                        fontSize: isMobile ? '20px' : '24px',
                        fontWeight: '900',
                        fontStyle: 'italic',
                        fontFamily: 'system-ui, sans-serif'
                    }}>
                        VN
                    </span>
                </div>
                <h2 style={{
                    margin: 0,
                    fontWeight: '900',
                    letterSpacing: '-1px',
                    fontSize: isMobile ? '22px' : '28px',
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: `'Inter', system-ui, -apple-system, sans-serif`
                }}>
                    <span style={{ color: isDark ? '#e8e8e8' : '#1f1f1f' }}>
                        TICKET
                    </span>
                </h2>
            </div>

            {!isMobile ? (
                <>
                    <Menu
                        mode="horizontal"
                        selectedKeys={[location.pathname]}
                        style={{
                            flex: 1,
                            borderBottom: 'none',
                            background: 'transparent',
                            fontWeight: 500,
                            fontSize: '15px'
                        }}
                    >
                        <Menu.Item key="/" style={{ padding: '0 20px' }}>
                            <Link to="/">{t('navbar.home')}</Link>
                        </Menu.Item>
                        {user && (
                            <Menu.Item key="/history" style={{ padding: '0 20px' }}>
                                <Link to="/history">🎟️ {t('navbar.myTickets')}</Link>
                            </Menu.Item>
                        )}
                        {user?.role === 'ROLE_ADMIN' && (
                            <Menu.Item key="/admin" style={{ padding: '0 20px' }}>
                                <Link to="/admin">
                                    <Badge count={pendingCount} offset={[10, 0]} size="small">
                                        🕹️ {t('navbar.systemManagement')}
                                        <span style={{ paddingRight: 8 }}></span>
                                    </Badge>
                                </Link>
                            </Menu.Item>
                        )}
                    </Menu>

                    <div className="auth-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <DarkModeToggle />
                        <LanguageSwitcher />
                        {user ? (
                            <>
                                <Button
                                    type="primary"
                                    shape="round"
                                    icon={<PlusOutlined />}
                                    onClick={() => navigate('/create-event')}
                                    style={{ padding: '0 24px', fontWeight: 500, boxShadow: '0 4px 10px rgba(24, 144, 255, 0.3)' }}
                                >
                                    {t('navbar.createEvent')}
                                </Button>
                                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                                    <Button
                                        type="text"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 16px',
                                            height: 'auto',
                                            borderRadius: '20px',
                                            background: isDark ? '#303030' : '#f5f5f5',
                                            fontWeight: 500,
                                            color: isDark ? '#e8e8e8' : undefined,
                                        }}
                                    >
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%', background: '#1890ff',
                                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <UserOutlined />
                                        </div>
                                        <span>{user.username}</span>
                                    </Button>
                                </Dropdown>
                            </>
                        ) : (
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button
                                    type="default"
                                    shape="round"
                                    onClick={() => navigate('/login')}
                                    style={{ fontWeight: 500, padding: '0 24px' }}
                                >
                                    {t('navbar.login')}
                                </Button>
                                <Button
                                    type="primary"
                                    shape="round"
                                    onClick={() => navigate('/register')}
                                    style={{ fontWeight: 500, padding: '0 24px', boxShadow: '0 4px 10px rgba(24, 144, 255, 0.3)' }}
                                >
                                    {t('navbar.register')}
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <DarkModeToggle />
                    <LanguageSwitcher />
                    <Button
                        type="text"
                        icon={<MenuOutlined style={{ fontSize: '20px', color: isDark ? '#fff' : '#000' }} />}
                        onClick={() => setMobileMenuOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                </div>
            )}

            {/* Mobile/Tablet Drawer Menu */}
            <Drawer
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold'
                        }}>VN</div>
                        <span style={{ fontWeight: 'bold' }}>TICKET</span>
                    </div>
                }
                placement="right"
                onClose={() => setMobileMenuOpen(false)}
                open={mobileMenuOpen}
                width={280}
                styles={{ body: { padding: 0 } }}
            >
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    style={{ borderRight: 'none' }}
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <Menu.Item key="/" icon={<UserOutlined />}>
                        <Link to="/">{t('navbar.home')}</Link>
                    </Menu.Item>
                    {user && (
                        <>
                            <Menu.Item key="/history" icon={<TagsOutlined />}>
                                <Link to="/history">{t('navbar.myTickets')}</Link>
                            </Menu.Item>
                            <Menu.Item key="/profile" icon={<UserOutlined />}>
                                <Link to="/profile">{t('navbar.profile')}</Link>
                            </Menu.Item>
                            {user.role === 'ROLE_ADMIN' && (
                                <Menu.Item key="/admin" icon={<PlusOutlined />}>
                                    <Link to="/admin">{t('navbar.systemManagement')}</Link>
                                </Menu.Item>
                            )}
                            <Menu.Divider />
                            <Menu.Item key="logout" icon={<LogoutOutlined />} danger onClick={handleLogout}>
                                {t('navbar.logout')}
                            </Menu.Item>
                        </>
                    )}
                    {!user && (
                        <>
                            <Menu.Item key="/login">
                                <Link to="/login">{t('navbar.login')}</Link>
                            </Menu.Item>
                            <Menu.Item key="/register">
                                <Link to="/register">{t('navbar.register')}</Link>
                            </Menu.Item>
                        </>
                    )}
                </Menu>
            </Drawer>


            <EventFormModal
                visible={isEventModalVisible}
                onCancel={() => setIsEventModalVisible(false)}
                onOk={handleCreateEvent}
                form={eventForm}
                title={t('navbar.createEventTitle')}
                editingEvent={false}
                isUser={true}
            />
        </Header>
    );
};

export default Navbar;
