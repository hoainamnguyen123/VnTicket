import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, NumberOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const { Title, Text } = Typography;

const VerifyEmail = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Lấy email từ state khi navigate sang
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            message.error('Không tìm thấy thông tin email. Vui lòng thử lại.');
            navigate('/register');
        }
    }, [email, navigate]);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await axiosClient.post('/auth/verify-email', {
                email: email,
                otp: values.otp
            });
            message.success('Xác thực email thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (error) {
            message.error(error.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        setResendLoading(true);
        try {
            await axiosClient.post('/auth/send-verify-email', { email });
            message.success('Đã gửi lại mã OTP đến email của bạn.');
            setCountdown(60); // 60s cooldown
        } catch (error) {
            message.error(error.message || 'Không thể gửi lại OTP. Vui lòng thử lại sau.');
        } finally {
            setResendLoading(false);
        }
    };

    if (!email) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '0 20px' }}>
            <Card style={{ width: '100%', maxWidth: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}>
                        <MailOutlined />
                    </div>
                    <Title level={2} style={{ color: '#1890ff', margin: 0 }}>Xác Thực Email</Title>
                    <div style={{ color: '#595959', marginTop: '12px', lineHeight: '1.6' }}>
                        Chúng tôi đã gửi một mã OTP gồm 6 chữ số đến email:
                        <br />
                        <Text strong style={{ fontSize: '16px' }}>{email}</Text>
                        <br />
                        Vui lòng kiểm tra hộp thư (cả thư mục Spam) và nhập mã vào bên dưới.
                    </div>
                </div>

                <Form form={form} name="verify_email" onFinish={onFinish} layout="vertical" size="large">
                    <Form.Item
                        name="otp"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mã OTP!' },
                            { len: 6, message: 'Mã OTP phải có đúng 6 chữ số!' },
                            { pattern: /^[0-9]+$/, message: 'Mã OTP chỉ bao gồm số!' }
                        ]}
                    >
                        <Input 
                            prefix={<NumberOutlined />} 
                            placeholder="Nhập mã OTP 6 số" 
                            maxLength={6}
                            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '18px', fontWeight: 'bold' }} 
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: '6px' }}>
                            Xác thực ngay
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Text type="secondary">Chưa nhận được mã? </Text>
                    <Button 
                        type="link" 
                        onClick={handleResend} 
                        disabled={countdown > 0} 
                        loading={resendLoading}
                        style={{ padding: 0 }}
                    >
                        {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại OTP'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default VerifyEmail;
