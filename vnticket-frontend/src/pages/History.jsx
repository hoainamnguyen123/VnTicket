import React, { useState, useEffect, useContext } from 'react';
import { Table, Typography, Tag, Button, Modal, message, Skeleton } from 'antd';
import { ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { confirm } = Modal;

const History = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            fetchBookings();
        }
    }, [user, navigate]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/bookings/my');
            setBookings(response.data);
        } catch (error) {
            message.error('Không thể tải lịch sử đặt vé!');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (bookingId) => {
        confirm({
            title: 'Xác nhận hủy vé',
            icon: <ExclamationCircleOutlined />,
            content: 'Bạn có chắc chắn muốn hủy đơn vé này không? Thao tác không thể hoàn tác.',
            okText: 'Xác nhận',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await axiosClient.put(`/bookings/${bookingId}/cancel`);
                    message.success('Hủy vé thành công!');
                    fetchBookings(); // Tải lại danh sách
                } catch (error) {
                    message.error(error.message || 'Hủy vé thất bại!');
                }
            },
        });
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'id',
            key: 'id',
            render: id => <strong>#{id}</strong>
        },
        {
            title: 'Sự kiện',
            dataIndex: 'eventName',
            key: 'eventName',
            render: text => <strong style={{ color: '#1890ff' }}>{text}</strong>
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'bookingTime',
            key: 'bookingTime',
            render: time => formatDate(time)
        },
        {
            title: 'Chi tiết vé',
            dataIndex: 'bookingDetails',
            key: 'details',
            render: details => (
                <div>
                    {details.map((d, index) => (
                        <div key={index}>
                            <Tag color="blue">{d.zoneName}</Tag> x {d.quantity} vé
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: amount => <Text type="danger" strong>{formatCurrency(amount)}</Text>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                let color = status === 'PAID' ? 'green' : (status === 'PENDING' ? 'gold' : 'red');
                let text = status === 'PAID' ? 'Đã Thanh Toán' : (status === 'PENDING' ? 'Chờ Thanh Toán' : 'Đã Hủy');
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="link"
                    danger
                    disabled={record.status !== 'PENDING'}
                    onClick={() => handleCancel(record.id)}
                >
                    Hủy Vé
                </Button>
            ),
        }
    ];

    if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>Lịch sử đặt vé</Title>
                <Button icon={<SyncOutlined />} onClick={fetchBookings}>Làm mới</Button>
            </div>

            <Table
                columns={columns}
                dataSource={bookings}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                style={{ background: '#fff' }}
            />
        </div>
    );
};

export default History;
