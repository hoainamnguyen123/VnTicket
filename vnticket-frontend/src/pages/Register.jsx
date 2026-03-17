import React, { useState, useContext, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';

const { Title } = Typography;

const GOOGLE_CLIENT_ID = '626920740184-b50brg5oc6psqva23adt7f9a7632fhp4.apps.googleusercontent.com';

const Register = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const googleBtnRef = useRef(null);

    useEffect(() => {
        const initGoogle = () => {
            if (window.google && window.google.accounts) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleCallback,
                });
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: '400',
                    text: 'signup_with',
                    locale: 'vi_VN',
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
    }, [form]);

    const handleGoogleCallback = async (response) => {
        setLoading(true);
        try {
            const res = await axiosClient.post('/auth/google', {
                idToken: response.credential,
            });
            const { token, ...userData } = res.data;
            login(userData, token);
            message.success('Đăng ký bằng Google thành công!');
            navigate('/');
        } catch (error) {
            message.error(error.message || 'Đăng ký bằng Google thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const { confirmPassword, ...registerData } = values;
            await axiosClient.post('/auth/register', registerData);
            message.success('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (error) {
            message.error(error.message || 'Đăng ký thất bại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Card style={{ width: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={2} style={{ color: '#1890ff', margin: 0 }}>Đăng Ký</Title>
                    <div style={{ color: '#8c8c8c' }}>Tạo tài khoản để mua vé dễ dàng hơn</div>
                </div>

                <Form form={form} name="register" onFinish={onFinish} layout="vertical" size="large" autoComplete="off">
                    <Form.Item name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}>
                        <Input prefix={<IdcardOutlined />} placeholder="Họ và tên" autoComplete="name" />
                    </Form.Item>

                    <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" autoComplete="off" />
                    </Form.Item>

                    <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}>
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>

                    <Form.Item name="phone" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}>
                        <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
                    </Form.Item>

                    <Form.Item 
                        name="password" 
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                            { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                            { pattern: /^(?=.*[A-Z])(?=.*\d).*$/, message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 chữ số!' }
                        ]}
                        hasFeedback
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        dependencies={['password']}
                        hasFeedback
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: '6px' }}>
                            ĐĂNG KÝ
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
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </div>
            </Card>
        </div>
    );
};

export default Register;
