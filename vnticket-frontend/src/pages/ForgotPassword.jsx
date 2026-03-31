import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Steps } from 'antd';
import { MailOutlined, KeyOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';

const { Title, Text } = Typography;

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [email, setEmail] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSendOTP = async (values) => {
        setLoading(true);
        try {
            await axiosClient.post('/auth/forgot-password', { email: values.email || email });
            setEmail(values.email || email);
            message.success(t('forgotPassword.otpSent', 'OTP has been sent to your email.'));
            setCurrentStep(1);
            setCooldown(60); // 60 seconds cooldown
        } catch (error) {
            message.error(error.message || t('forgotPassword.error', 'Failed to send OTP.'));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (values) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error(t('forgotPassword.passwordMismatch', 'Passwords do not match.'));
            return;
        }

        setLoading(true);
        try {
            await axiosClient.post('/auth/reset-password', {
                email,
                otp: values.otp,
                newPassword: values.newPassword
            });
            message.success(t('forgotPassword.success', 'Password reset successfully. Please login.'));
            navigate('/login');
        } catch (error) {
            message.error(error.message || t('forgotPassword.resetError', 'Reset password failed.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Card style={{ width: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
                        {t('forgotPassword.title', 'Forgot Password')}
                    </Title>
                    <Text type="secondary">
                        {currentStep === 0 
                            ? t('forgotPassword.descStep1', 'Enter your registered email') 
                            : t('forgotPassword.descStep2', 'Enter OTP and your new password')}
                    </Text>
                </div>

                <Steps current={currentStep} style={{ marginBottom: 24 }}>
                    <Steps.Step title={t('forgotPassword.step1', 'Email')} />
                    <Steps.Step title={t('forgotPassword.step2', 'Reset')} />
                </Steps>

                {currentStep === 0 && (
                    <Form name="forgot_password_request" onFinish={handleSendOTP} layout="vertical" size="large">
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: t('forgotPassword.emailRequired', 'Email is required') },
                                { type: 'email', message: t('forgotPassword.emailInvalid', 'Invalid email format') }
                            ]}
                        >
                            <Input prefix={<MailOutlined />} placeholder={t('forgotPassword.emailPlaceholder', 'Email address')} />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: '6px' }}>
                                {t('forgotPassword.sendOtpBtn', 'Send OTP')}
                            </Button>
                        </Form.Item>
                    </Form>
                )}

                {currentStep === 1 && (
                    <Form name="forgot_password_reset" onFinish={handleResetPassword} layout="vertical" size="large">
                        <Form.Item
                            name="otp"
                            rules={[{ required: true, message: t('forgotPassword.otpRequired', 'OTP is required') }, { len: 6, message: 'OTP must be 6 characters' }]}
                        >
                            <Input prefix={<KeyOutlined />} placeholder={t('forgotPassword.otpPlaceholder', '6-digit OTP')} maxLength={6} />
                        </Form.Item>

                        <Form.Item
                            name="newPassword"
                            rules={[{ required: true, message: t('forgotPassword.newPwdRequired', 'New password is required') }, { min: 6, message: 'Minimum 6 characters' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder={t('forgotPassword.newPwdPlaceholder', 'New Password')} />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            rules={[{ required: true, message: t('forgotPassword.confirmPwdRequired', 'Please confirm password') }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder={t('forgotPassword.confirmPwdPlaceholder', 'Confirm New Password')} />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: '6px', marginBottom: 12 }}>
                                {t('forgotPassword.resetBtn', 'Reset Password')}
                            </Button>
                            
                            <Button 
                                type="default" 
                                onClick={() => handleSendOTP({ email })} 
                                loading={loading} 
                                disabled={cooldown > 0} 
                                block 
                                style={{ borderRadius: '6px' }}
                            >
                                {cooldown > 0 
                                    ? t('forgotPassword.resendCooldown', `Resend OTP in ${cooldown}s`, { cooldown })
                                    : t('forgotPassword.resendBtn', 'Resend OTP')}
                            </Button>
                        </Form.Item>
                    </Form>
                )}

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Link to="/login">{t('forgotPassword.backToLogin', 'Back to Login')}</Link>
                </div>
            </Card>
        </div>
    );
};

export default ForgotPassword;
