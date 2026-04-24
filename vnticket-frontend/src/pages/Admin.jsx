import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Space, Popconfirm, Row, Col, Card, Statistic, Tag, Typography, Image, Divider, Tabs, Badge, Checkbox, Grid, Empty } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined, DollarOutlined, TagsOutlined, CheckCircleOutlined, BarChartOutlined, UserOutlined, EnvironmentOutlined, ClockCircleOutlined, ExclamationCircleOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import EventFormModal from '../components/EventFormModal';
import { ThemeContext } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Option } = Select;
const { TextArea } = Input;

const Admin = () => {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const { isDark } = useContext(ThemeContext);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [eventRevenueData, setEventRevenueData] = useState([]);
    const [eventTypeData, setEventTypeData] = useState([]);
    const [activeTab, setActiveTab] = useState('APPROVED');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [form] = Form.useForm();
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [rejectionReasonText, setRejectionReasonText] = useState('');
    const [searchText, setSearchText] = useState('');
    const [showOnlySlider, setShowOnlySlider] = useState(false);
    const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);

    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    useEffect(() => {
        fetchEvents();
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axiosClient.get('/bookings/statistics');
            setStats(res.data);
        } catch (error) {
            console.error(t('admin.loadStatsError'), error);
        }
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            // Fetch a large number of events to handle client-side filtering effectively
            const res = await axiosClient.get(`/admin/events?page=0&size=1000`);
            const allEvents = res.data.content || [];

            // Sort by ID descending (newest first)
            allEvents.sort((a, b) => b.id - a.id);

            setEvents(allEvents);

            // Calculate Chart Data
            let revenueData = allEvents.map(event => {
                let revenue = 0;
                if (event.ticketTypes) {
                    event.ticketTypes.forEach(tt => {
                        const sold = tt.totalQuantity - (tt.remainingQuantity || 0);
                        if (sold > 0) revenue += sold * tt.price;
                    });
                }
                return { name: event.name.length > 20 ? event.name.substring(0, 20) + '...' : event.name, revenue };
            });
            let sortedRevenue = [...revenueData].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
            setEventRevenueData(sortedRevenue);

            let typeMap = {};
            allEvents.forEach(e => {
                if (!e.type) return;
                typeMap[e.type] = (typeMap[e.type] || 0) + 1;
            });
            let pieData = Object.keys(typeMap).map(key => ({ name: key, value: typeMap[key] }));
            setEventTypeData(pieData);

            // Dispatch event to sync Navbar badge
            window.dispatchEvent(new CustomEvent('event-status-updated'));

        } catch (error) {
            message.error(t('admin.loadEventsError'));
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
    };

    const handleViewEventStats = (record) => {
        navigate(`/admin/event-stats/${record.id}`);
    };

    const handleAdd = () => {
        navigate('/create-event');
    };

    const handleEdit = (record) => {
        setIsEventDetailVisible(false);
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
            detailAddress,
            isSlider: record.isSlider || false,
            isFeatured: record.isFeatured || false
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axiosClient.delete(`/admin/events/${id}`);
            message.success(t('admin.deleteSuccess'));
            if (viewingEvent && viewingEvent.id === id) {
                setIsEventDetailVisible(false);
            }
            fetchEvents();
        } catch (error) {
            message.error(t('admin.deleteError'));
        }
    };

    const [isEventDetailVisible, setIsEventDetailVisible] = useState(false);
    const [viewingEvent, setViewingEvent] = useState(null);

    const handleViewEventDetail = (record) => {
        setViewingEvent(record);
        setIsEventDetailVisible(true);
    };

    const handleUpdateStatus = async (id, status, reason = '') => {
        try {
            let url = `/admin/events/${id}/status?status=${status}`;
            if (reason) url += `&rejectionReason=${encodeURIComponent(reason)}`;
            await axiosClient.put(url);
            message.success(t('admin.statusUpdateSuccess', { action: status === 'APPROVED' ? t('admin.approve') : t('admin.reject') }));
            fetchEvents();
        } catch (error) {
            message.error(t('admin.statusUpdateError'));
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReasonText.trim()) {
            message.warning(t('admin.enterRejectionReason', 'Vui lòng nhập lý do từ chối'));
            return;
        }
        await handleUpdateStatus(viewingEvent.id, 'REJECTED', rejectionReasonText);
        setIsRejectModalVisible(false);
        setIsEventDetailVisible(false);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const combinedLocation = [values.detailAddress, values.ward, values.province].filter(Boolean).join(', ');
            const payload = {
                ...values,
                location: combinedLocation,
                startTime: values.startTime.format('YYYY-MM-DDTHH:mm:ss'),
                isSlider: values.isSlider || false,
                isFeatured: values.isFeatured || false
            };

            delete payload.province;
            delete payload.ward;
            delete payload.detailAddress;

            console.log("Dữ liệu gửi lên API Admin:", payload);

            if (editingEvent) {
                await axiosClient.put(`/admin/events/${editingEvent.id}`, payload);
                message.success(t('admin.editSuccess'));
            } else {
                await axiosClient.post('/admin/events', payload);
                message.success(t('admin.addSuccess'));
            }
            setIsModalVisible(false);
            fetchEvents();
        } catch (error) {
            if (error.errorFields) return;
            message.error(editingEvent ? t('admin.editError') : t('admin.addError'));
        }
    };

    // Reactively compute filtered lists based on searchText
    // Reactively compute filtered lists based on searchText and toggles
    const filteredEvents = events.filter(e => {
        const search = searchText.toLowerCase();
        
        // Basic fields match
        const matchesBasic = !searchText || 
                           e.name?.toLowerCase().includes(search) ||
                           e.organizerName?.toLowerCase().includes(search) ||
                           e.location?.toLowerCase().includes(search);
        
        // Attribute filters
        const matchesSlider = showOnlySlider ? e.isSlider : true;
        const matchesFeatured = showOnlyFeatured ? e.isFeatured : true;
                           
        return matchesBasic && matchesSlider && matchesFeatured;
    });

    const displayPending = filteredEvents.filter(e => e.status === 'PENDING' || e.status === 'PENDING_EDIT');
    const displayApproved = filteredEvents.filter(e => e.status === 'APPROVED');
    const displayRejected = filteredEvents.filter(e => e.status === 'REJECTED');

    const columns = [
        { title: t('admin.id'), dataIndex: 'id', key: 'id', width: 60 },
        {
            title: t('admin.eventName'),
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: '500' }}>{text}</div>
                    <Space size="small" style={{ marginTop: 4 }}>
                        {record.isSlider && <Tag color="magenta">{t('admin.slider')}</Tag>}
                        {record.isFeatured && <Tag color="geekblue">{t('admin.featured')}</Tag>}
                    </Space>
                </div>
            )
        },
        { title: t('admin.type'), dataIndex: 'type', key: 'type', width: 100 },
        {
            title: t('admin.time'),
            dataIndex: 'startTime',
            key: 'startTime',
            render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
            width: 150
        },
        { title: t('admin.location'), dataIndex: 'location', key: 'location', width: 200 },
        {
            title: t('admin.status'),
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                let color = status === 'APPROVED' ? 'green' : (status === 'PENDING' ? 'gold' : (status === 'PENDING_EDIT' ? 'orange' : 'red'));
                let text = status === 'APPROVED' ? t('admin.approved') : status === 'PENDING' ? t('admin.pending') : status === 'PENDING_EDIT' ? t('admin.pendingEdit', 'Chờ duyệt (Chỉnh sửa)') : t('admin.rejected');
                return <Tag color={color}>{text}</Tag>;
            }
        },
    ];

    const renderEventList = (dataSource) => {
        if (isMobile) {
            return (
                <Row gutter={[16, 16]}>
                    {dataSource.map(event => (
                        <Col xs={24} key={event.id}>
                            <Card 
                                size="small" 
                                hoverable
                                onClick={() => handleViewEventDetail(event)}
                                actions={[
                                    <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); handleEdit(event); }} />,
                                    <BarChartOutlined key="stats" onClick={(e) => { e.stopPropagation(); handleViewEventStats(event); }} />,
                                    <Popconfirm
                                        key="delete"
                                        title={t('admin.deleteConfirm')}
                                        onConfirm={() => handleDelete(event.id)}
                                    >
                                        <DeleteOutlined style={{ color: '#ff4d4f' }} onClick={(e) => e.stopPropagation()} />
                                    </Popconfirm>
                                ]}
                            >
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Image 
                                        src={event.imageUrl} 
                                        width={80} 
                                        height={80} 
                                        style={{ objectFit: 'cover', borderRadius: 4 }} 
                                        preview={false} 
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>{event.name}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            <ClockCircleOutlined /> {dayjs(event.startTime).format('DD/MM/YYYY HH:mm')}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                                            <EnvironmentOutlined /> {event.location?.split(',').slice(-1)[0]}
                                        </div>
                                        <Space wrap size={4}>
                                            <Tag color={event.status === 'APPROVED' ? 'green' : (event.status === 'PENDING' ? 'gold' : 'red')} style={{ fontSize: '10px' }}>
                                                {event.status === 'APPROVED' ? t('admin.approved') : event.status === 'PENDING' ? t('admin.pending') : t('admin.rejected')}
                                            </Tag>
                                            {event.isSlider && <Tag color="magenta" style={{ fontSize: '10px' }}>Slider</Tag>}
                                            {event.isFeatured && <Tag color="geekblue" style={{ fontSize: '10px' }}>{t('admin.featured')}</Tag>}
                                        </Space>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                    {dataSource.length === 0 && <Col span={24}><Empty /></Col>}
                </Row>
            );
        }

        return (
            <Table
                columns={columns}
                dataSource={dataSource}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({ onClick: () => handleViewEventDetail(record), style: { cursor: 'pointer' } })}
            />
        );
    };

    return (
        <div style={{ padding: isMobile ? '0 10px' : 0 }}>
            <Tabs defaultActiveKey="DASHBOARD" size={isMobile ? 'middle' : 'large'} style={{ marginBottom: 24 }}>
                <Tabs.TabPane tab={<span><BarChartOutlined /> {t('admin.dashboard')}</span>} key="DASHBOARD">
                    {stats && (
                        <div style={{ marginBottom: 32, padding: '16px 0' }}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12} md={6}>
                                    <Card className="dashboard-card" bodyStyle={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Typography.Text type="secondary" style={{ fontSize: '16px' }}>{t('admin.totalBookings')}</Typography.Text>
                                                <Typography.Title level={2} style={{ margin: 0 }}>{stats.totalBookings}</Typography.Title>
                                            </div>
                                            <div className="stat-icon-wrapper" style={{ background: isDark ? 'transparent' : '#e6f4ff', color: '#1890ff' }}>
                                                <TagsOutlined />
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card className="dashboard-card" bodyStyle={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Typography.Text type="secondary" style={{ fontSize: '16px' }}>{t('admin.bookedTickets')}</Typography.Text>
                                                <Typography.Title level={2} style={{ margin: 0 }}>{stats.totalTicketsBooked}</Typography.Title>
                                            </div>
                                            <div className="stat-icon-wrapper" style={{ background: isDark ? 'transparent' : '#fff0f6', color: '#eb2f96' }}>
                                                <UserOutlined />
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card className="dashboard-card" bodyStyle={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Typography.Text type="secondary" style={{ fontSize: '16px' }}>{t('admin.paidTickets')}</Typography.Text>
                                                <Typography.Title level={2} style={{ margin: 0, color: '#52c41a' }}>{stats.totalTicketsPaid}</Typography.Title>
                                            </div>
                                            <div className="stat-icon-wrapper" style={{ background: isDark ? 'transparent' : '#f6ffed', color: '#52c41a' }}>
                                                <CheckCircleOutlined />
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card className="dashboard-card" bodyStyle={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Typography.Text type="secondary" style={{ fontSize: '16px' }}>{t('admin.totalRevenue')}</Typography.Text>
                                                <Typography.Title level={3} style={{ margin: 0, color: '#f5222d' }}>{stats.totalRevenue?.toLocaleString()} ₫</Typography.Title>
                                            </div>
                                            <div className="stat-icon-wrapper" style={{ background: isDark ? 'transparent' : '#fff1f0', color: '#f5222d' }}>
                                                <DollarOutlined />
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>

                            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                                <Col xs={24} lg={16}>
                                    <Card title={t('admin.topRevenueEvents')} className="dashboard-card" bodyStyle={{ height: isMobile ? 300 : 350, padding: '20px 0' }} headStyle={{ borderBottom: isDark ? '1px solid #303030' : '1px solid #f0f0f0' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={eventRevenueData} layout="vertical" margin={{ top: 20, right: 30, left: isMobile ? 60 : 120, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tickFormatter={(val) => `${val / 1000000}M`} />
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: isMobile ? 10 : 13 }} width={isMobile ? 50 : 110} />
                                                <RechartsTooltip formatter={(value) => `${value.toLocaleString()} VNĐ`} cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: isDark ? '#1f1f1f' : '#fff', borderColor: isDark ? '#303030' : '#ccc', color: isDark ? '#e8e8e8' : '#000' }} itemStyle={{ color: isDark ? '#e8e8e8' : '#000' }} />
                                                <Bar dataKey="revenue" fill="#1890ff" radius={[0, 4, 4, 0]} barSize={30}>
                                                    {eventRevenueData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#1890ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1'][index % 5]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                                <Col xs={24} lg={8}>
                                    <Card title={t('admin.eventTypeDistrib')} className="dashboard-card" bodyStyle={{ height: 350, padding: 0 }} headStyle={{ borderBottom: isDark ? '1px solid #303030' : '1px solid #f0f0f0' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={eventTypeData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value" label>
                                                    {eventTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#f5222d', '#fa8c16', '#a0d911', '#1890ff', '#722ed1'][index % 5]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1f1f1f' : '#fff', borderColor: isDark ? '#303030' : '#ccc', color: isDark ? '#e8e8e8' : '#000' }} itemStyle={{ color: isDark ? '#e8e8e8' : '#000' }} />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Tabs.TabPane>

                <Tabs.TabPane
                    tab={
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TagsOutlined /> {t('admin.eventManagement')}
                            <Badge count={displayPending.length} showZero={false} />
                        </span>
                    }
                    key="EVENTS"
                >
                    <div style={{ padding: '16px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '24px' }}>{t('admin.eventList')}</h2>
                                    <Input.Search
                                        placeholder={t('admin.searchPlaceholder', 'Tìm tên, BTC, địa điểm...')}
                                        allowClear
                                        onChange={(e) => setSearchText(e.target.value)}
                                        style={{ width: isMobile ? '100%' : 300 }}
                                    />
                                </div>
                                <Space size={isMobile ? 'middle' : 'large'} wrap>
                                    <Checkbox 
                                        checked={showOnlySlider} 
                                        onChange={(e) => setShowOnlySlider(e.target.checked)}
                                    >
                                        <Tag color="magenta" style={{ cursor: 'pointer', margin: 0 }}>Slider</Tag>
                                    </Checkbox>
                                    <Checkbox 
                                        checked={showOnlyFeatured} 
                                        onChange={(e) => setShowOnlyFeatured(e.target.checked)}
                                    >
                                        <Tag color="geekblue" style={{ cursor: 'pointer', margin: 0 }}>{t('admin.featured', 'Nổi bật')}</Tag>
                                    </Checkbox>
                                </Space>
                            </div>
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                {t('admin.addEvent')}
                            </Button>
                        </div>

                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            type="card"
                            items={[
                                {
                                    label: <span><CheckCircleOutlined /> {t('admin.approved')} ({displayApproved.length})</span>,
                                    key: 'APPROVED',
                                    children: renderEventList(displayApproved)
                                },
                                {
                                    label: (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ExclamationCircleOutlined /> {t('admin.pending')}
                                            <Badge count={displayPending.length} showZero={false} />
                                        </span>
                                    ),
                                    key: 'PENDING',
                                    children: renderEventList(displayPending)
                                },
                                {
                                    label: <span><MinusCircleOutlined /> {t('admin.rejected')} ({displayRejected.length})</span>,
                                    key: 'REJECTED',
                                    children: renderEventList(displayRejected)
                                }
                            ]}
                        />
                    </div>
                </Tabs.TabPane>
            </Tabs>

            <EventFormModal
                title={editingEvent ? t('admin.editEvent') : t('admin.addEvent')}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                form={form}
                editingEvent={!!editingEvent}
                isUser={false}
            />


            <Modal
                title={t('admin.eventDetails', { name: viewingEvent?.name || '' })}
                open={isEventDetailVisible}
                onCancel={() => setIsEventDetailVisible(false)}
                width={isMobile ? '100%' : 1000}
                style={{ top: isMobile ? 0 : 20 }}
                footer={viewingEvent ? (
                    (viewingEvent.status === 'PENDING' || viewingEvent.status === 'PENDING_EDIT') ? [
                        <Button key="reject" type="primary" danger onClick={() => {
                            setRejectionReasonText('');
                            setIsRejectModalVisible(true);
                        }}>
                            {t('admin.reject')}
                        </Button>,
                        <Button key="approve" type="primary" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} onClick={() => {
                            handleUpdateStatus(viewingEvent.id, 'APPROVED');
                            setIsEventDetailVisible(false);
                        }}>
                            {t('admin.approve')}
                        </Button>
                    ] : [
                        <Button
                            key="stats"
                            icon={<BarChartOutlined />}
                            onClick={() => { handleViewEventStats(viewingEvent); setIsEventDetailVisible(false); }}
                        >
                            {t('admin.viewStats')}
                        </Button>,
                        <Button
                            key="edit"
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(viewingEvent)}
                        >
                            {t('admin.edit')}
                        </Button>,
                        <Popconfirm
                            key="delete"
                            title={t('admin.deleteConfirm')}
                            onConfirm={() => handleDelete(viewingEvent.id)}
                            okText={t('admin.yes')}
                            cancelText={t('admin.no')}
                        >
                            <Button type="primary" danger icon={<DeleteOutlined />}>{t('admin.delete')}</Button>
                        </Popconfirm>
                    ]
                ) : null}
            >
                {viewingEvent && (
                    <div style={{ padding: isMobile ? '10px 0' : '20px 0' }}>
                        <Row gutter={[32, 24]}>
                            <Col xs={24} md={10}>
                                <Image
                                    src={viewingEvent.imageUrl}
                                    alt={viewingEvent.name}
                                    style={{ width: '100%', borderRadius: 8, objectFit: 'cover' }}
                                    fallback="https://via.placeholder.com/400x300?text=No+Image"
                                />
                                {viewingEvent.additionalImages?.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                        <Typography.Title level={5}>{t('admin.relatedImages')}</Typography.Title>
                                        <Image.PreviewGroup>
                                            <Space size="small" wrap>
                                                {viewingEvent.additionalImages.map((img, idx) => (
                                                    <Image
                                                        key={idx}
                                                        src={img}
                                                        width={isMobile ? 80 : 100}
                                                        height={isMobile ? 60 : 70}
                                                        style={{ objectFit: 'cover', borderRadius: 4 }}
                                                        fallback="https://via.placeholder.com/100x70?text=Error"
                                                    />
                                                ))}
                                            </Space>
                                        </Image.PreviewGroup>
                                    </div>
                                )}
                            </Col>
                            <Col xs={24} md={14}>
                                <Typography.Title level={isMobile ? 3 : 2}>{viewingEvent.name}</Typography.Title>
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <Typography.Paragraph>
                                        <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>{t('admin.organizer')}</strong> {viewingEvent.organizerName || t('admin.notUpdated')}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph>
                                        <MailOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>{t('admin.organizerEmail')}</strong> {viewingEvent.organizerEmail || t('admin.notUpdated')}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph>
                                        <PhoneOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>{t('admin.organizerPhone')}</strong> {viewingEvent.organizerPhone || t('admin.notUpdated')}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph>
                                        <TagsOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>{t('admin.category')}</strong> <Tag color="blue">{viewingEvent.type}</Tag>
                                    </Typography.Paragraph>
                                    <Typography.Paragraph>
                                        <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>{t('admin.location')}</strong> {viewingEvent.location}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph>
                                        <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>{t('admin.time')}</strong> {dayjs(viewingEvent.startTime).format('HH:mm - DD/MM/YYYY')}
                                    </Typography.Paragraph>
                                </Space>
                                <Divider />
                                <Typography.Title level={4}>{t('admin.detailedDesc')}</Typography.Title>
                                <Typography.Paragraph style={{ whiteSpace: 'pre-line' }}>{viewingEvent.description}</Typography.Paragraph>
                                <Divider />
                                <Typography.Title level={4}>{t('admin.expectedPrices')}</Typography.Title>
                                <Table
                                    dataSource={viewingEvent.ticketTypes || []}
                                    rowKey={(item, index) => item.id || index}
                                    pagination={false}
                                    scroll={{ x: 'max-content' }}
                                    columns={[
                                        { title: t('admin.zone'), dataIndex: 'zoneName', key: 'zoneName', render: (text) => <strong>{text}</strong> },
                                        { title: t('admin.price'), dataIndex: 'price', key: 'price', render: (price) => <span style={{ color: '#cf1322', fontWeight: 'bold' }}>{price?.toLocaleString()} VNĐ</span> },
                                        { title: t('admin.quantity'), dataIndex: 'totalQuantity', key: 'totalQuantity' }
                                    ]}
                                />
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>

            <Modal
                title={t('admin.rejectEventTitle', 'Lý do từ chối phê duyệt')}
                open={isRejectModalVisible}
                onOk={handleRejectSubmit}
                onCancel={() => setIsRejectModalVisible(false)}
                okText={t('admin.confirmReject', 'Từ chối sự kiện')}
                okButtonProps={{ danger: true }}
                cancelText={t('common.cancel', 'Hủy')}
            >
                <div style={{ marginBottom: 8 }}>{t('admin.rejectReasonLabel', 'Vui lòng cho người dùng biết lý do sự kiện bị từ chối:')}</div>
                <TextArea 
                    rows={4} 
                    value={rejectionReasonText}
                    onChange={(e) => setRejectionReasonText(e.target.value)}
                    placeholder={t('admin.rejectReasonPlaceholder', 'Ví dụ: Hình ảnh chưa phù hợp, thông tin thiếu chi tiết...')}
                />
            </Modal>
        </div>
    );
};

export default Admin;
