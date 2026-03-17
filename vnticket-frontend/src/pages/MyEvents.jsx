import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, message, Space, Upload, Tag, Statistic, Row, Col, Card } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import EventFormModal from '../components/EventFormModal';
import { AuthContext } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import dayjs from 'dayjs';

const { TextArea } = Input;

const MyEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/events/my');
            setEvents(response.data.content);
        } catch (error) {
            message.error('Lỗi tải danh sách sự kiện của bạn!');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        try {
            const values = await form.validateFields();
            const combinedLocation = [values.detailAddress, values.ward, values.province].filter(Boolean).join(', ');
            const eventData = {
                ...values,
                location: combinedLocation,
                startTime: values.startTime.format('YYYY-MM-DDTHH:mm:ss'),
                additionalImages: values.additionalImages?.map(item => item?.url || item) || [],
                ticketTypes: values.ticketTypes || []
            };

            delete eventData.province;
            delete eventData.ward;
            delete eventData.detailAddress;

            console.log("Dữ liệu gửi lên API MyEvents:", eventData);

            await axiosClient.post('/events/my', eventData);
            message.success('Đã gửi yêu cầu tạo sự kiện thành công! Vui lòng chờ Admin duyệt.');
            setIsModalVisible(false);
            form.resetFields();
            fetchMyEvents();
        } catch (error) {
            if (!error.errorFields) message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện!');
        }
    };

    const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);
    const [eventStats, setEventStats] = useState(null);
    const [selectedEventName, setSelectedEventName] = useState('');

    const handleViewEventStats = async (record) => {
        try {
            const res = await axiosClient.get(`/bookings/statistics/my-event/${record.id}`);
            setEventStats(res.data);
            setSelectedEventName(record.name);
            setIsStatsModalVisible(true);
        } catch (error) {
            message.error('Không thể tải thống kê cho sự kiện này');
        }
    };

    const columns = [
        {
            title: 'Tên Sự Kiện',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Địa Điểm',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: 'Thời Gian',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (time) => formatDate(time),
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'APPROVED' ? 'green' : status === 'PENDING' ? 'gold' : 'red';
                let text = status === 'APPROVED' ? 'Đã duyệt' : status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối';
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Hành Động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    {record.status === 'APPROVED' && (
                        <Button
                            type="dashed"
                            onClick={() => handleViewEventStats(record)}
                        >
                            Xem Thống Kê Doanh Thu
                        </Button>
                    )}
                </Space>
            ),
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    Tạo Sự Kiện Mới
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={events}
                rowKey="id"
                loading={loading}
            />

            <EventFormModal
                title="Tạo Sự Kiện Mới (Chờ Duyệt)"
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={handleCreateEvent}
                form={form}
                editingEvent={false}
                isUser={true}
            />

            <Modal
                title={`Thống kê Doanh Thu Sự Kiện: ${selectedEventName}`}
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
                                    title="Số Vé Đã Đặt (Pending + Paid)"
                                    value={eventStats.totalTicketsBooked}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title="Số Vé Đã Thanh Toán"
                                    value={eventStats.totalTicketsPaid}
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title="Tổng Doanh Thu Bán Vé"
                                    value={eventStats.totalRevenue}
                                    suffix="VNĐ"
                                    valueStyle={{ color: '#cf1322' }}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title="Thực Nhận (Sau khi trừ 2% phí hệ thống)"
                                    value={eventStats.totalRevenue - (eventStats.totalRevenue * 0.02)}
                                    suffix="VNĐ"
                                    valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                                />
                            </Card>
                        </Col>
                    </Row>
                ) : (
                    <p>Đang tải dữ liệu chờ xíu nhe...</p>
                )}
            </Modal>
        </div>
    );
};

export default MyEvents;
