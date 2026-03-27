import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, message, Space, Upload, Tag, Statistic, Row, Col, Card } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
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
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/events/my');
            setEvents(response.data.content);
        } catch (error) {
            message.error(t('myEvents.loadError'));
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
            message.success(t('myEvents.createSuccess'));
            setIsModalVisible(false);
            form.resetFields();
            fetchMyEvents();
        } catch (error) {
            if (!error.errorFields) message.error(error.response?.data?.message || t('myEvents.createError'));
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
            message.error(t('myEvents.statsError'));
        }
    };

    const columns = [
        {
            title: t('myEvents.eventName'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: t('myEvents.location'),
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: t('myEvents.time'),
            dataIndex: 'startTime',
            key: 'startTime',
            render: (time) => formatDate(time),
        },
        {
            title: t('myEvents.status'),
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'APPROVED' ? 'green' : status === 'PENDING' ? 'gold' : 'red';
                let text = status === 'APPROVED' ? t('myEvents.approved') : status === 'PENDING' ? t('myEvents.pendingStatus') : t('myEvents.rejected');
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: t('myEvents.actions'),
            key: 'action',
            render: (_, record) => (
                <Space>
                    {record.status === 'APPROVED' && (
                        <Button
                            type="dashed"
                            onClick={() => handleViewEventStats(record)}
                        >
                            {t('myEvents.viewStats')}
                        </Button>
                    )}
                </Space>
            ),
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create-event')}>
                    {t('myEvents.createEvent')}
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={events}
                rowKey="id"
                loading={loading}
            />

            <EventFormModal
                title={t('myEvents.createEventPending')}
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={handleCreateEvent}
                form={form}
                editingEvent={false}
                isUser={true}
            />

            <Modal
                title={t('myEvents.statsTitle', { name: selectedEventName })}
                open={isStatsModalVisible}
                onCancel={() => setIsStatsModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsStatsModalVisible(false)}>
                        {t('common.close')}
                    </Button>
                ]}
                width={800}
            >
                {eventStats ? (
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title={t('myEvents.totalBooked')}
                                    value={eventStats.totalTicketsBooked}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title={t('myEvents.totalPaid')}
                                    value={eventStats.totalTicketsPaid}
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title={t('myEvents.totalRevenue')}
                                    value={eventStats.totalRevenue}
                                    suffix="VNĐ"
                                    valueStyle={{ color: '#cf1322' }}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title={t('myEvents.netRevenue')}
                                    value={eventStats.totalRevenue - (eventStats.totalRevenue * 0.02)}
                                    suffix="VNĐ"
                                    valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                                />
                            </Card>
                        </Col>
                    </Row>
                ) : (
                    <p>{t('myEvents.loadingData')}</p>
                )}
            </Modal>
        </div>
    );
};

export default MyEvents;
