import React, { useContext, useState, useEffect } from 'react';
import { Tabs, Typography, Card, Descriptions, Button, Form, Input, message, Spin } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import History from './History';
import MyEvents from './MyEvents';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const { Title } = Typography;

const Profile = () => {
    const { user, setUser } = useContext(AuthContext); // In case we need to update the basic context user data
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form] = Form.useForm();

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
            message.error('Không thể tải thông tin hồ sơ.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (values) => {
        try {
            const res = await axiosClient.put('/users/me', values);
            setProfileData(res.data);
            message.success('Cập nhật thông tin thành công!');
            setEditing(false);

            // Optionally update context user
            if (setUser && res.data.username) {
                setUser({ ...user, ...res.data });
                // Also update localStorage so it persists correctly
                const lsUser = JSON.parse(localStorage.getItem('user'));
                if (lsUser) {
                    localStorage.setItem('user', JSON.stringify({ ...lsUser, ...res.data }));
                }
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
        }
    };

    if (!user) {
        return <Navigate to="/login" />;
    }

    const items = [
        {
            key: '1',
            label: 'Thông tin tài khoản',
            children: (
                <Card bordered={false} loading={loading}>
                    {editing ? (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdateProfile}
                            style={{ maxWidth: 600 }}
                        >
                            <Form.Item label="Tên người dùng">
                                <Input disabled value={profileData?.username} />
                            </Form.Item>
                            <Form.Item
                                name="fullName"
                                label="Họ và tên"
                            >
                                <Input placeholder="Nhập họ và tên" />
                            </Form.Item>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Email không hợp lệ!' }
                                ]}
                            >
                                <Input placeholder="Nhập email" />
                            </Form.Item>
                            <Form.Item
                                name="phone"
                                label="Số điện thoại"
                                rules={[
                                    { pattern: /^[0-9]+$/, message: 'Số điện thoại chỉ bao gồm chữ số!' }
                                ]}
                            >
                                <Input placeholder="Nhập số điện thoại" />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ marginRight: 8 }}>
                                    Lưu thay đổi
                                </Button>
                                <Button onClick={() => { setEditing(false); form.resetFields(); }} icon={<CloseOutlined />}>
                                    Hủy
                                </Button>
                            </Form.Item>
                        </Form>
                    ) : (
                        <div>
                            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>
                                    Chỉnh sửa hồ sơ
                                </Button>
                            </div>
                            <Descriptions title="Tài khoản cá nhân" bordered column={1}>
                                <Descriptions.Item label="Tên đăng nhập">{profileData?.username}</Descriptions.Item>
                                <Descriptions.Item label="Họ và tên">{profileData?.fullName || <i>Chưa cập nhật</i>}</Descriptions.Item>
                                <Descriptions.Item label="Email">{profileData?.email}</Descriptions.Item>
                                <Descriptions.Item label="Số điện thoại">{profileData?.phone || <i>Chưa cập nhật</i>}</Descriptions.Item>
                                <Descriptions.Item label="Phân quyền">
                                    {profileData?.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Hội viên'}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    )}
                </Card>
            ),
        },
        {
            key: '2',
            label: 'Lịch sử đặt vé',
            children: <History />,
        },
        {
            key: '3',
            label: 'Sự kiện của tôi',
            children: <MyEvents />,
        },
    ];

    return (
        <div>
            <Title level={2} style={{ marginBottom: '24px' }}>Hồ sơ cá nhân</Title>
            <Tabs defaultActiveKey="1" items={items} />
        </div>
    );
};

export default Profile;

