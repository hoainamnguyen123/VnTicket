import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Space, Popconfirm, Row, Col, Card, Statistic, Tag, Typography, Image, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined, DollarOutlined, TagsOutlined, CheckCircleOutlined, BarChartOutlined, UserOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient from '../api/axiosClient';
import EventFormModal from '../components/EventFormModal';

const { Option } = Select;
const { TextArea } = Input;

const Admin = () => {
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);
    const [eventStats, setEventStats] = useState(null);
    const [selectedEventName, setSelectedEventName] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);
    const [form] = Form.useForm();

    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    useEffect(() => {
        fetchEvents(pagination.current - 1, pagination.pageSize);
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axiosClient.get('/bookings/statistics');
            setStats(res.data);
        } catch (error) {
            console.error('Không thể tải thống kê', error);
        }
    };

    const fetchEvents = async (page = 0, size = 10) => {
        setLoading(true);
        try {
            const res = await axiosClient.get(`/admin/events?page=${page}&size=${size}`);
            setEvents(res.data.content);
            setPagination({
                ...pagination,
                current: res.data.number + 1,
                total: res.data.totalElements,
            });
        } catch (error) {
            message.error('Không thể tải danh sách sự kiện');
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (newPagination) => {
        fetchEvents(newPagination.current - 1, newPagination.pageSize);
    };

    const handleViewEventStats = async (record) => {
        try {
            const res = await axiosClient.get(`/bookings/statistics/event/${record.id}`);
            setEventStats(res.data);
            setSelectedEventName(record.name);
            setIsStatsModalVisible(true);
        } catch (error) {
            message.error('Không thể tải thống kê cho sự kiện này');
        }
    };

    const handleAdd = () => {
        setEditingEvent(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingEvent(record);

        let locationParts = record.location ? record.location.split(', ') : [];
        let detailAddress = locationParts.length > 2 ? locationParts.slice(0, -2).join(', ') : '';
        let ward = locationParts.length > 1 ? locationParts[locationParts.length - 2] : '';
        let province = locationParts.length > 0 ? locationParts[locationParts.length - 1] : record.location;

        form.setFieldsValue({
            ...record,
            startTime: dayjs(record.startTime),
            province,
            ward,
            detailAddress
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axiosClient.delete(`/admin/events/${id}`);
            message.success('Xóa sự kiện thành công');
            fetchEvents(pagination.current - 1, pagination.pageSize);
        } catch (error) {
            message.error('Lỗi khi xóa sự kiện');
        }
    };

    const [isEventDetailVisible, setIsEventDetailVisible] = useState(false);
    const [viewingEvent, setViewingEvent] = useState(null);

    const handleViewEventDetail = (record) => {
        setViewingEvent(record);
        setIsEventDetailVisible(true);
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await axiosClient.put(`/admin/events/${id}/status?status=${status}`);
            message.success(`Đã ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} sự kiện!`);
            fetchEvents(pagination.current - 1, pagination.pageSize);
        } catch (error) {
            message.error('Lỗi cập nhật trạng thái sự kiện!');
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const combinedLocation = [values.detailAddress, values.ward, values.province].filter(Boolean).join(', ');
            const payload = {
                ...values,
                location: combinedLocation,
                startTime: values.startTime.format('YYYY-MM-DDTHH:mm:ss'),
            };

            delete payload.province;
            delete payload.ward;
            delete payload.detailAddress;

            console.log("Dữ liệu gửi lên API Admin:", payload);

            if (editingEvent) {
                await axiosClient.put(`/admin/events/${editingEvent.id}`, payload);
                message.success('Cập nhật sự kiện thành công');
            } else {
                await axiosClient.post('/admin/events', payload);
                message.success('Thêm mới sự kiện thành công');
            }
            setIsModalVisible(false);
            fetchEvents(pagination.current - 1, pagination.pageSize);
        } catch (error) {
            if (error.errorFields) return;
            message.error(editingEvent ? 'Lỗi khi cập nhật' : 'Lỗi khi thêm mới');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Tên Sự Kiện', dataIndex: 'name', key: 'name' },
        { title: 'Loại', dataIndex: 'type', key: 'type', width: 100 },
        {
            title: 'Thời Gian',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
            width: 150
        },
        { title: 'Địa Điểm', dataIndex: 'location', key: 'location', width: 200 },
        {
            title: 'Trạng Thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                let color = status === 'APPROVED' ? 'green' : status === 'PENDING' ? 'gold' : 'red';
                let text = status === 'APPROVED' ? 'Đã duyệt' : status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối';
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Hành Động',
            key: 'action',
            width: 250,
            render: (_, record) => (
                <Space>
                    {record.status === 'PENDING' && (
                        <Button
                            type="primary"
                            onClick={() => handleViewEventDetail(record)}
                        >
                            Xem Chi Tiết
                        </Button>
                    )}
                    <Button
                        type="default"
                        icon={<BarChartOutlined />}
                        onClick={() => handleViewEventStats(record)}
                        title="Xem Thống kê"
                    />
                    <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm
                        title="Bạn có chắc muốn xóa?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="primary" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        }
    ];

    return (
        <div>
            {stats && (
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tổng Đơn Hàng"
                                value={stats.totalBookings}
                                prefix={<TagsOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Vé Đã Đặt (Tất cả)"
                                value={stats.totalTicketsBooked}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Vé Đã Thanh Toán"
                                value={stats.totalTicketsPaid}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tổng Doanh Thu"
                                value={stats.totalRevenue}
                                suffix="VNĐ"
                                prefix={<DollarOutlined />}
                                valueStyle={{ color: '#cf1322' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2>Quản lý Sự Kiện</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    Thêm Sự Kiện
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={events}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
            />

            <EventFormModal
                title={editingEvent ? 'Sửa Sự Kiện' : 'Thêm Sự Kiện'}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                form={form}
                editingEvent={!!editingEvent}
                isUser={false}
            />

            <Modal
                title={`Thống kê Sự Kiện: ${selectedEventName}`}
                open={isStatsModalVisible}
                onCancel={() => setIsStatsModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsStatsModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                {eventStats ? (
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title="Số Vé Đã Đặt"
                                    value={eventStats.totalTicketsBooked}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title="Số Vé Đã Thanh Toán"
                                    value={eventStats.totalTicketsPaid}
                                    prefix={<CheckCircleOutlined />}
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title="Lượt Booking"
                                    value={eventStats.totalBookings}
                                    prefix={<TagsOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title="Doanh Thu"
                                    value={eventStats.totalRevenue}
                                    suffix="VNĐ"
                                    prefix={<DollarOutlined />}
                                    valueStyle={{ color: '#cf1322' }}
                                />
                            </Card>
                        </Col>
                    </Row>
                ) : (
                    <p>Đang tải dữ liệu...</p>
                )}
            </Modal>

            <Modal
                title="Chi tiết Cấu hình Sự Kiện Chờ Duyệt"
                open={isEventDetailVisible}
                onCancel={() => setIsEventDetailVisible(false)}
                width={1000}
                style={{ top: 20 }}
                footer={[
                    <Button key="reject" type="primary" danger onClick={() => {
                        handleUpdateStatus(viewingEvent.id, 'REJECTED');
                        setIsEventDetailVisible(false);
                    }}>
                        Từ Chối
                    </Button>,
                    <Button key="approve" type="primary" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} onClick={() => {
                        handleUpdateStatus(viewingEvent.id, 'APPROVED');
                        setIsEventDetailVisible(false);
                    }}>
                        Duyệt Sự Kiện
                    </Button>
                ]}
            >
                {viewingEvent && (
                    <div style={{ padding: '20px 0' }}>
                        <Row gutter={[32, 24]}>
                            <Col span={10}>
                                <Image
                                    src={viewingEvent.imageUrl}
                                    alt={viewingEvent.name}
                                    style={{ width: '100%', borderRadius: 8, objectFit: 'cover' }}
                                    fallback="https://via.placeholder.com/400x300?text=No+Image"
                                />
                                {viewingEvent.additionalImages?.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                        <Typography.Title level={5}>Ảnh liên quan</Typography.Title>
                                        <Image.PreviewGroup>
                                            <Space size="small" wrap>
                                                {viewingEvent.additionalImages.map((img, idx) => (
                                                    <Image
                                                        key={idx}
                                                        src={img}
                                                        width={100}
                                                        height={70}
                                                        style={{ objectFit: 'cover', borderRadius: 4 }}
                                                        fallback="https://via.placeholder.com/100x70?text=Error"
                                                    />
                                                ))}
                                            </Space>
                                        </Image.PreviewGroup>
                                    </div>
                                )}
                            </Col>
                            <Col span={14}>
                                <Typography.Title level={2}>{viewingEvent.name}</Typography.Title>
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <Typography.Paragraph>
                                        <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>Ban tổ chức:</strong> {viewingEvent.organizerName || 'Chưa cập nhật'}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph>
                                        <TagsOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>Phân loại:</strong> <Tag color="blue">{viewingEvent.type}</Tag>
                                    </Typography.Paragraph>
                                    <Typography.Paragraph>
                                        <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>Địa điểm:</strong> {viewingEvent.location}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph>
                                        <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>Thời gian:</strong> {dayjs(viewingEvent.startTime).format('HH:mm - DD/MM/YYYY')}
                                    </Typography.Paragraph>
                                </Space>

                                <Divider />
                                <Typography.Title level={4}>Mô tả chi tiết</Typography.Title>
                                <Typography.Paragraph style={{ whiteSpace: 'pre-line' }}>{viewingEvent.description}</Typography.Paragraph>

                                <Divider />
                                <Typography.Title level={4}>Bảng giá vé dự kiến</Typography.Title>
                                <Table
                                    dataSource={viewingEvent.ticketTypes || []}
                                    rowKey={(item, index) => item.id || index}
                                    pagination={false}
                                    columns={[
                                        { title: 'Khu vực', dataIndex: 'zoneName', key: 'zoneName', render: (text) => <strong>{text}</strong> },
                                        { title: 'Giá vé', dataIndex: 'price', key: 'price', render: (price) => <span style={{ color: '#cf1322', fontWeight: 'bold' }}>{price?.toLocaleString()} VNĐ</span> },
                                        { title: 'Số lượng phát hành', dataIndex: 'totalQuantity', key: 'totalQuantity' }
                                    ]}
                                />
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Admin;
