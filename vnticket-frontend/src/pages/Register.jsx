import React, { useState, useContext, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const { Title } = Typography;

const GOOGLE_CLIENT_ID = '626920740184-b50brg5oc6psqva23adt7f9a7632fhp4.apps.googleusercontent.com';

const Register = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const navigate = useNavigate();
    const googleBtnRef = useRef(null);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const initGoogle = () => {
            if (window.google && window.google.accounts) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleCallback,
                });
                const btnWidth = Math.min(400, Math.max(200, window.innerWidth - 80));
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: isDark ? 'filled_black' : 'outline',
                    size: 'large',
                    width: btnWidth.toString(),
                    text: 'signup_with',
                    locale: i18n.language === 'vi' ? 'vi_VN' : 'en_US',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                });
            }
        };

        if (window.google && window.google.accounts) {
            initGoogle();
        } else {
            const interval = setInterval(() => {
                if (window.google && window.google.accounts) {
                    clearInterval(interval);
                    initGoogle();
                }
            }, 100);
            return () => clearInterval(interval);
        }

        // Đảm bảo form luôn trống khi truy cập
        form.resetFields();
    }, [form, i18n.language, isDark]);

    const handleGoogleCallback = async (response) => {
        setLoading(true);
        try {
            const res = await axiosClient.post('/auth/google', {
                idToken: response.credential,
            });
            const { token, ...userData } = res.data;
            login(userData, token);
            message.success(t('register.googleSuccess'));
            navigate('/');
        } catch (error) {
            message.error(error.message || t('register.googleFailed'));
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const { confirmPassword, ...registerData } = values;
            await axiosClient.post('/auth/register', registerData);
            message.success(t('register.success'));
            navigate('/login');
        } catch (error) {
            let errorMsg = error.message;
            if (errorMsg) {
                const lowerMsg = errorMsg.toLowerCase();
                if (lowerMsg.includes('username') && lowerMsg.includes('taken')) {
                    errorMsg = t('register.usernameTaken');
                } else if (lowerMsg.includes('email') && (lowerMsg.includes('taken') || lowerMsg.includes('use'))) {
                    errorMsg = t('register.emailTaken');
                }
            }
            message.error(errorMsg || t('register.failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '0 20px' }}>
            <Card style={{ width: '100%', maxWidth: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={2} style={{ color: '#1890ff', margin: 0 }}>{t('register.title')}</Title>
                    <div style={{ color: '#8c8c8c' }}>{t('register.subtitle')}</div>
                </div>

                <Form form={form} name="register" onFinish={onFinish} layout="vertical" size="large" autoComplete="off">
                    <Form.Item name="fullName" rules={[{ required: true, message: t('register.fullNameRequired') }]}>
                        <Input prefix={<IdcardOutlined />} placeholder={t('register.fullNamePlaceholder')} autoComplete="name" />
                    </Form.Item>

                    <Form.Item name="username" rules={[{ required: true, message: t('register.usernameRequired') }]}>
                        <Input prefix={<UserOutlined />} placeholder={t('register.usernamePlaceholder')} autoComplete="off" />
                    </Form.Item>

                    <Form.Item name="email" rules={[{ required: true, type: 'email', message: t('register.emailRequired') }]}>
                        <Input prefix={<MailOutlined />} placeholder={t('register.emailPlaceholder')} />
                    </Form.Item>

                    <Form.Item name="phone" rules={[{ required: true, message: t('register.phoneRequired') }]}>
                        <Input prefix={<PhoneOutlined />} placeholder={t('register.phonePlaceholder')} />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: t('register.passwordRequired') },
                            { min: 8, message: t('register.passwordMin') },
                            { pattern: /^(?=.*[A-Z])(?=.*\d).*$/, message: t('register.passwordPattern') }
                        ]}
                        hasFeedback
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder={t('register.passwordPlaceholder')} autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        dependencies={['password']}
                        hasFeedback
                        rules={[
                            { required: true, message: t('register.confirmPasswordRequired') },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error(t('register.confirmPasswordMismatch')));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder={t('register.confirmPasswordPlaceholder')} autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: '6px' }}>
                            {t('register.submitButton')}
                        </Button>
                    </Form.Item>
                </Form>

                <Divider plain style={{ margin: '12px 0', color: '#8c8c8c', fontSize: '13px' }}>
                    {t('register.or')}
                </Divider>

                <div className="google-btn-wrapper" style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginBottom: '16px',
                    width: '100%',
                    minHeight: '44px'
                }}>
                    <div ref={googleBtnRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
                </div>

                <Divider style={{ margin: '12px 0' }} />
                <div style={{ textAlign: 'center' }}>
                    {t('register.hasAccount')} <Link to="/login">{t('register.loginNow')}</Link>
                </div>
            </Card>
        </div>
    );
};

export default Register;
