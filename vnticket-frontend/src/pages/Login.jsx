import React, { useContext, useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';

const { Title } = Typography;

const GOOGLE_CLIENT_ID = '626920740184-b50brg5oc6psqva23adt7f9a7632fhp4.apps.googleusercontent.com';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const googleBtnRef = useRef(null);

    useEffect(() => {
        // Wait for Google Identity Services script to load
        const initGoogle = () => {
            if (window.google && window.google.accounts) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleCallback,
                });
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: '352',
                    text: 'signin_with',
                    locale: 'vi_VN',
                });
            }
        };

        // Google script might already be loaded or need to wait
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
    }, []);

    const handleGoogleCallback = async (response) => {
        setLoading(true);
        try {
            const res = await axiosClient.post('/auth/google', {
                idToken: response.credential,
            });
            const { token, ...userData } = res.data;
            login(userData, token);
            message.success('Đăng nhập bằng Google thành công!');
            navigate('/');
        } catch (error) {
            message.error(error.message || 'Đăng nhập bằng Google thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await axiosClient.post('/auth/login', values);
            const { token, ...userData } = response.data;
            login(userData, token);
            message.success('Đăng nhập thành công!');
            navigate('/');
        } catch (error) {
            message.error(error.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={2} style={{ color: '#1890ff', margin: 0 }}>Đăng nhập</Title>
                    <div style={{ color: '#8c8c8c' }}>Chào mừng trở lại VNTicket!</div>
                </div>

                <Form name="login" onFinish={onFinish} layout="vertical" size="large">
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: '6px' }}>
                            ĐĂNG NHẬP
                        </Button>
                    </Form.Item>
                </Form>

                <Divider plain style={{ margin: '12px 0', color: '#8c8c8c', fontSize: '13px' }}>
                    hoặc
                </Divider>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div ref={googleBtnRef}></div>
                </div>

                <Divider style={{ margin: '12px 0' }} />
                <div style={{ textAlign: 'center' }}>
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </div>
            </Card>
        </div>
    );
};

export default Login;
