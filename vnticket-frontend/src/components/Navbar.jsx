import React, { useContext, useState } from 'react';
import { Layout, Menu, Button, Dropdown, Form, message, Drawer, Grid } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserOutlined, LogoutOutlined, HistoryOutlined, PlusOutlined, MenuOutlined, TagsOutlined } from '@ant-design/icons';
import EventFormModal from './EventFormModal';
import axiosClient from '../api/axiosClient';

const { Header } = Layout;
const { useBreakpoint } = Grid;

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Hồ sơ cá nhân',
            onClick: () => navigate('/profile'),
        },
        {
            key: 'my-tickets',
            icon: <TagsOutlined />,
            label: 'Vé của tôi',
            onClick: () => navigate('/history'),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: handleLogout,
        },
    ];

    const [isEventModalVisible, setIsEventModalVisible] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [eventForm] = Form.useForm();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

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

            console.log("Dữ liệu gửi lên API Navbar:", eventData);

            await axiosClient.post('/events/my', eventData);
            message.success('Đã gửi yêu cầu tạo sự kiện thành công! Vui lòng chờ duyệt.');
            setIsEventModalVisible(false);
            eventForm.resetFields();
            if (location.pathname !== '/profile') {
                navigate('/profile');
            } else {
                window.location.reload();
            }
        } catch (error) {
            if (!error.errorFields) message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện!');
        }
    };

    return (
        <Header style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: isMobile ? '0 16px' : '0 50px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            height: '70px',
            borderBottom: '1px solid #f0f0f0'
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
                    <span style={{ color: '#1f1f1f' }}>
                        TICKET
                    </span>
                    <span 
                        className="logo-dot"
                        style={{
                            width: '6px',
                            height: '6px',
                            background: '#1890ff',
                            borderRadius: '50%',
                            marginLeft: '4px',
                            alignSelf: 'flex-end',
                            marginBottom: isMobile ? '4px' : '6px'
                        }}
                    ></span>
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
                            <Link to="/">Trang Chủ</Link>
                        </Menu.Item>
                        {user && (
                            <Menu.Item key="/history" style={{ padding: '0 20px' }}>
                                <Link to="/history">🎟️ Vé của tôi</Link>
                            </Menu.Item>
                        )}
                        {user?.role === 'ROLE_ADMIN' && (
                            <Menu.Item key="/admin" style={{ padding: '0 20px' }}>
                                <Link to="/admin">🕹️ Quản lý Hệ thống</Link>
                            </Menu.Item>
                        )}
                    </Menu>

                    <div className="auth-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {user ? (
                            <>
                                <Button
                                    type="primary"
                                    shape="round"
                                    icon={<PlusOutlined />}
                                    onClick={() => setIsEventModalVisible(true)}
                                    style={{ padding: '0 24px', fontWeight: 500, boxShadow: '0 4px 10px rgba(24, 144, 255, 0.3)' }}
                                >
                                    Tạo sự kiện
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
                                            background: '#f5f5f5',
                                            fontWeight: 500
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
                                    Đăng nhập
                                </Button>
                                <Button
                                    type="primary"
                                    shape="round"
                                    onClick={() => navigate('/register')}
                                    style={{ fontWeight: 500, padding: '0 24px', boxShadow: '0 4px 10px rgba(24, 144, 255, 0.3)' }}
                                >
                                    Đăng ký
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <Button
                    type="text"
                    icon={<MenuOutlined style={{ fontSize: '20px' }} />}
                    onClick={() => setMobileMenuOpen(true)}
                />
            )}

            <Drawer
                title="Menu"
                placement="right"
                onClose={() => setMobileMenuOpen(false)}
                open={mobileMenuOpen}
                width={280}
                styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
            >
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%', background: '#1890ff',
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                            }}>
                                <UserOutlined />
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                                <div style={{ fontSize: '12px', color: '#888' }}>{user.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Thành viên'}</div>
                            </div>
                        </div>
                    )}

                    <Button type="text" block style={{ textAlign: 'left', height: 'auto', padding: '10px 15px' }} onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
                        Trang Chủ
                    </Button>

                    {user?.role === 'ROLE_ADMIN' && (
                        <Button type="text" block style={{ textAlign: 'left', height: 'auto', padding: '10px 15px' }} onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}>
                            🕹️ Quản lý Hệ thống
                        </Button>
                    )}

                    {user && (
                        <>
                            <Button type="text" block style={{ textAlign: 'left', height: 'auto', padding: '10px 15px' }} onClick={() => { navigate('/history'); setMobileMenuOpen(false); }}>
                                🎟️ Vé của tôi
                            </Button>
                            <Button type="text" block style={{ textAlign: 'left', height: 'auto', padding: '10px 15px' }} onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                                👤 Hồ sơ cá nhân
                            </Button>
                        </>
                    )}
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid #f0f0f0', background: '#fff', marginTop: 'auto' }}>
                    {user ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Button type="primary" block size="large" icon={<PlusOutlined />} onClick={() => { setMobileMenuOpen(false); setIsEventModalVisible(true); }}>
                                Tạo sự kiện
                            </Button>
                            <Button danger block size="large" icon={<LogoutOutlined />} onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                                Đăng xuất
                            </Button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Button block size="large" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Đăng nhập</Button>
                            <Button type="primary" block size="large" onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>Đăng ký</Button>
                        </div>
                    )}
                </div>
            </Drawer>

            <EventFormModal
                visible={isEventModalVisible}
                onCancel={() => setIsEventModalVisible(false)}
                onOk={handleCreateEvent}
                form={eventForm}
                title="Tạo Sự Kiện Mới"
                editingEvent={false}
                isUser={true}
            />
        </Header>
    );
};

export default Navbar;
