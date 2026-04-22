import React, { useContext, useState, useEffect } from 'react';
import { Tabs, Typography, Card, Descriptions, Button, Form, Input, message, Spin, Grid } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import History from './History';
import MyEvents from './MyEvents';
import { AuthContext } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const { Title } = Typography;

const Profile = () => {
    const { user, setUser, loading: authLoading } = useContext(AuthContext);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form] = Form.useForm();
    const { t } = useTranslation();
    const location = useLocation();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || '1');

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/users/me');
            setProfileData(res.data);
            form.setFieldsValue(res.data);
        } catch (error) {
            message.error(t('profile.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (values) => {
        try {
            const res = await axiosClient.put('/users/me', values);
            setProfileData(res.data);
            message.success(t('profile.updateSuccess'));
            setEditing(false);

            if (setUser && res.data.username) {
                setUser({ ...user, ...res.data });
                const lsUser = JSON.parse(localStorage.getItem('user'));
                if (lsUser) {
                    localStorage.setItem('user', JSON.stringify({ ...lsUser, ...res.data }));
                }
            }
        } catch (error) {
            message.error(error.response?.data?.message || t('profile.updateError'));
        }
    };

    if (authLoading) {
        return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }} />;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    const items = [
        {
            key: '1',
            label: t('profile.accountInfo'),
            children: (
                <Card bordered={false} loading={loading}>
                    {editing ? (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdateProfile}
                            style={{ maxWidth: 600 }}
                        >
                            <Form.Item label={t('profile.usernameLabel')}>
                                <Input disabled value={profileData?.username} />
                            </Form.Item>
                            <Form.Item
                                name="fullName"
                                label={t('profile.fullNameLabel')}
                            >
                                <Input placeholder={t('profile.fullNamePlaceholder')} />
                            </Form.Item>
                            <Form.Item
                                name="email"
                                label={t('profile.emailLabel')}
                                rules={[
                                    { required: true, message: t('profile.emailRequired') },
                                    { type: 'email', message: t('profile.emailInvalid') }
                                ]}
                            >
                                <Input placeholder={t('profile.emailPlaceholder')} />
                            </Form.Item>
                            <Form.Item
                                name="phone"
                                label={t('profile.phoneLabel')}
                                rules={[
                                    { pattern: /^[0-9]+$/, message: t('profile.phoneInvalid') }
                                ]}
                            >
                                <Input placeholder={t('profile.phonePlaceholder')} />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ marginRight: 8 }}>
                                    {t('profile.saveChanges')}
                                </Button>
                                <Button onClick={() => { setEditing(false); form.resetFields(); }} icon={<CloseOutlined />}>
                                    {t('common.cancel')}
                                </Button>
                            </Form.Item>
                        </Form>
                    ) : (
                        <div>
                            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>
                                    {t('profile.editProfile')}
                                </Button>
                            </div>
                            <Descriptions title={t('profile.personalAccount')} bordered column={1}>
                                <Descriptions.Item label={t('profile.loginLabel')}>{profileData?.username}</Descriptions.Item>
                                <Descriptions.Item label={t('profile.fullNameLabel')}>{profileData?.fullName || <i>{t('common.notUpdated')}</i>}</Descriptions.Item>
                                <Descriptions.Item label={t('profile.emailLabel')}>{profileData?.email}</Descriptions.Item>
                                <Descriptions.Item label={t('profile.phoneLabel')}>{profileData?.phone || <i>{t('common.notUpdated')}</i>}</Descriptions.Item>
                                <Descriptions.Item label={t('profile.roleLabel')}>
                                    {profileData?.role === 'ROLE_ADMIN' ? t('profile.roleAdmin') : t('profile.roleMember')}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    )}
                </Card>
            ),
        },
        {
            key: '2',
            label: t('profile.bookingHistory'),
            children: <History />,
        },
        {
            key: '3',
            label: t('profile.myEvents'),
            children: <MyEvents />,
        },
    ];

    return (
        <div style={{ padding: isMobile ? '0 16px' : 0 }}>
            <Title level={2} style={{ marginBottom: '24px' }}>{t('profile.title')}</Title>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
        </div>
    );
};

export default Profile;
