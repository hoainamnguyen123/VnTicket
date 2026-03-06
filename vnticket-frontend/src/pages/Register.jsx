import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const { Title } = Typography;

const Register = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await axiosClient.post('/auth/register', values);
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

                <Form name="register" onFinish={onFinish} layout="vertical" size="large">
                    <Form.Item name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}>
                        <Input prefix={<IdcardOutlined />} placeholder="Họ và tên" />
                    </Form.Item>

                    <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
                    </Form.Item>

                    <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}>
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>

                    <Form.Item name="phone" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}>
                        <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block style={{ borderRadius: '6px' }}>
                            ĐĂNG KÝ
                        </Button>
                    </Form.Item>
                </Form>

                <Divider style={{ margin: '12px 0' }} />
                <div style={{ textAlign: 'center' }}>
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </div>
            </Card>
        </div>
    );
};

export default Register;
