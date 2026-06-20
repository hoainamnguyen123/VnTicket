import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm, Row, Col, Card, Tag, Typography, Image, Tabs, Badge, Checkbox, Grid, Empty, Tooltip, Spin, Descriptions, Pagination } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined, TagsOutlined, CheckCircleOutlined, BarChartOutlined, EnvironmentOutlined, ClockCircleOutlined, ExclamationCircleOutlined, SaveOutlined, TagOutlined, EyeOutlined, PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import EventFormModal from '../components/EventFormModal';
import AdminDashboardOverview from '../components/AdminDashboardOverview';
import { saveAdminEvent } from '../api/adminEventApi';
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
    const [eventPage, setEventPage] = useState(1);
    const [adminSection, setAdminSection] = useState('DASHBOARD');
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
    const [savingEvent, setSavingEvent] = useState(false);

    // Ticket type management state
    const [isTicketModalVisible, setIsTicketModalVisible] = useState(false);
    const [editingTicketTypes, setEditingTicketTypes] = useState([]);
    const [ticketModalEvent, setTicketModalEvent] = useState(null);
    const [ticketSaving, setTicketSaving] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const res = await axiosClient.get('/bookings/statistics');
            setStats(res.data);
        } catch (error) {
            console.error(t('admin.loadStatsError'), error);
        }
    }, [t]);

    const fetchEvents = useCallback(async () => {
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

        } catch {
            message.error(t('admin.loadEventsError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchEvents();
        fetchStats();
    }, [fetchEvents, fetchStats]);

    const handleViewEventStats = (record) => {
        navigate(`/admin/event-stats/${record.id}`);
    };

    const handleAdd = () => {
        setEditingEvent(null);
        form.resetFields();
        form.setFieldsValue({
            isSlider: false,
            isFeatured: false,
            ticketTypes: [{ zoneName: '', price: 0, totalQuantity: 100 }],
        });
        setIsModalVisible(true);
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
        } catch {
            message.error(t('admin.deleteError'));
        }
    };

    const [isEventDetailVisible, setIsEventDetailVisible] = useState(false);
    const [viewingEvent, setViewingEvent] = useState(null);
    const [detailTab, setDetailTab] = useState('overview');

    const handleViewEventDetail = (record) => {
        setViewingEvent(record);
        setDetailTab('overview');
        setIsEventDetailVisible(true);
    };

    const handleUpdateStatus = async (id, status, reason = '') => {
        try {
            let url = `/admin/events/${id}/status?status=${status}`;
            if (reason) url += `&rejectionReason=${encodeURIComponent(reason)}`;
            await axiosClient.put(url);
            message.success(t('admin.statusUpdateSuccess', { action: status === 'APPROVED' ? t('admin.approve') : t('admin.reject') }));
            fetchEvents();
        } catch {
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
            setSavingEvent(true);
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

            await saveAdminEvent({
                eventId: editingEvent?.id,
                payload,
            });
            message.success(editingEvent ? t('admin.editSuccess') : t('admin.addSuccess'));
            setIsModalVisible(false);
            form.resetFields();
            fetchEvents();
        } catch (error) {
            if (error.errorFields) {
                setSavingEvent(false);
                return;
            }
            message.error(editingEvent ? t('admin.editError') : t('admin.addError'));
        } finally {
            setSavingEvent(false);
        }
    };

    // ─── Ticket Type Management ───
    const handleManageTickets = (event) => {
        setIsEventDetailVisible(false);
        setTicketModalEvent(event);
        // Clone danh sách ticket types với trường sold tính toán sẵn
        const cloned = (event.ticketTypes || []).map(tt => ({
            ...tt,
            sold: tt.totalQuantity - (tt.remainingQuantity ?? tt.totalQuantity),
            key: tt.id,
        }));
        setEditingTicketTypes(cloned);
        setIsTicketModalVisible(true);
    };

    const handleAddTicketRow = () => {
        const tempKey = `new_${Date.now()}`;
        setEditingTicketTypes(prev => [...prev, {
            key: tempKey,
            id: null,
            zoneName: '',
            price: 0,
            totalQuantity: 0,
            remainingQuantity: 0,
            sold: 0,
        }]);
    };

    const handleTicketTypeChange = (key, field, value) => {
        setEditingTicketTypes(prev => prev.map(tt => {
            if (tt.key !== key) return tt;
            const updated = { ...tt, [field]: value };
            // Khi totalQuantity thay đổi, tính lại remainingQuantity
            if (field === 'totalQuantity') {
                updated.remainingQuantity = Math.max(0, value - (tt.sold || 0));
            }
            return updated;
        }));
    };

    const handleDeleteTicketRow = (key) => {
        setEditingTicketTypes(prev => prev.filter(tt => tt.key !== key));
    };

    const handleSaveAdminTicketTypes = async () => {
        // Validate
        for (const tt of editingTicketTypes) {
            if (!tt.zoneName?.trim()) {
                message.warning('Vui lòng nhập tên khu vực cho tất cả các loại vé!');
                return;
            }
            if (tt.totalQuantity < (tt.sold || 0)) {
                message.warning(`Khu vực "${tt.zoneName}": số lượng không thể nhỏ hơn số đã bán (${tt.sold}).`);
                return;
            }
        }

        setTicketSaving(true);
        try {
            const payload = editingTicketTypes.map(tt => ({
                id: tt.id || null,
                zoneName: tt.zoneName,
                price: tt.price,
                totalQuantity: tt.totalQuantity,
                remainingQuantity: tt.remainingQuantity,
            }));
            await axiosClient.put(`/admin/events/${ticketModalEvent.id}/ticket-types`, payload);
            message.success(t('admin.ticketUpdatedSuccess', 'Cập nhật loại vé thành công!'));
            setIsTicketModalVisible(false);
            fetchEvents();
        } catch (error) {
            message.error(error.response?.data?.message || t('admin.ticketUpdatedError', 'Lỗi khi cập nhật loại vé'));
        } finally {
            setTicketSaving(false);
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

    const getStatusMeta = (status) => {
        if (status === 'APPROVED') return { color: 'green', text: t('admin.approved') };
        if (status === 'PENDING_EDIT') return { color: 'orange', text: t('admin.pendingEdit', 'Chờ duyệt chỉnh sửa') };
        if (status === 'PENDING') return { color: 'gold', text: t('admin.pending') };
        return { color: 'red', text: t('admin.rejected') };
    };

    const renderEventList = (dataSource) => {
        const pageSize = 12;
        const pageItems = dataSource.slice((eventPage - 1) * pageSize, eventPage * pageSize);
        return (
        <Spin spinning={loading}>
            {dataSource.length === 0 ? (
                <Empty description="Không có sự kiện phù hợp" style={{ padding: '48px 0' }} />
            ) : (
                <>
                <Row gutter={[18, 18]}>
                    {pageItems.map((event) => {
                        const status = getStatusMeta(event.status);
                        const sold = (event.ticketTypes || []).reduce(
                            (total, ticket) => total + Math.max(0, ticket.totalQuantity - (ticket.remainingQuantity ?? ticket.totalQuantity)),
                            0,
                        );
                        return (
                            <Col xs={24} sm={12} xl={8} xxl={6} key={event.id}>
                                <Card
                                    hoverable
                                    onClick={() => handleViewEventDetail(event)}
                                    cover={(
                                        <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
                                            <img
                                                src={event.imageUrl || 'https://via.placeholder.com/600x340?text=VNTicket'}
                                                alt={event.name}
                                                loading="lazy"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'linear-gradient(180deg, transparent 48%, rgba(0,0,0,.68) 100%)',
                                            }} />
                                            <Tag color={status.color} style={{ position: 'absolute', top: 12, left: 12, margin: 0 }}>
                                                {status.text}
                                            </Tag>
                                            <span style={{
                                                position: 'absolute',
                                                right: 12,
                                                bottom: 10,
                                                color: '#fff',
                                                fontWeight: 700,
                                                fontSize: 12,
                                            }}>
                                                #{event.id}
                                            </span>
                                        </div>
                                    )}
                                    styles={{ body: { padding: 16 } }}
                                    style={{ borderRadius: 16, overflow: 'hidden', height: '100%' }}
                                >
                                    <Space orientation="vertical" size={9} style={{ width: '100%' }}>
                                        <Typography.Title level={5} ellipsis={{ rows: 2 }} style={{ margin: 0, minHeight: 48 }}>
                                            {event.name}
                                        </Typography.Title>
                                        <Typography.Text type="secondary" ellipsis>
                                            <ClockCircleOutlined /> {dayjs(event.startTime).format('HH:mm · DD/MM/YYYY')}
                                        </Typography.Text>
                                        <Typography.Text type="secondary" ellipsis>
                                            <EnvironmentOutlined /> {event.location || 'Chưa cập nhật địa điểm'}
                                        </Typography.Text>
                                        <Space wrap size={[4, 4]}>
                                            <Tag color="blue">{event.type || 'Khác'}</Tag>
                                            {event.isSlider && <Tag color="magenta">Slider</Tag>}
                                            {event.isFeatured && <Tag color="geekblue">{t('admin.featured')}</Tag>}
                                        </Space>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderTop: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                                            paddingTop: 12,
                                        }}>
                                            <Typography.Text type="secondary">{sold} vé đã bán</Typography.Text>
                                            <Button type="link" icon={<EyeOutlined />} style={{ padding: 0 }}>
                                                Quản lý
                                            </Button>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
                {dataSource.length > pageSize && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                        <Pagination
                            current={eventPage}
                            pageSize={pageSize}
                            total={dataSource.length}
                            showSizeChanger={false}
                            onChange={setEventPage}
                        />
                    </div>
                )}
                </>
            )}
        </Spin>
        );
    };

    return (
        <div style={{ padding: isMobile ? '0 10px' : 0 }}>
            <Spin fullscreen spinning={savingEvent} size="large" tip="Đang lưu thông tin sự kiện..." />
            <Tabs
                activeKey={adminSection}
                onChange={setAdminSection}
                size={isMobile ? 'middle' : 'large'}
                style={{ marginBottom: 24 }}
            >
                <Tabs.TabPane tab={<span><BarChartOutlined /> {t('admin.dashboard')}</span>} key="DASHBOARD">
                    {stats && (
                        <div style={{ marginBottom: 32, padding: '16px 0' }}>
                            <AdminDashboardOverview
                                stats={stats}
                                pendingCount={displayPending.length}
                                approvedCount={displayApproved.length}
                                rejectedCount={displayRejected.length}
                                onCreateEvent={handleAdd}
                                onOpenPending={() => {
                                    setAdminSection('EVENTS');
                                    setActiveTab('PENDING');
                                }}
                            />
                            <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
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
                                        onChange={(e) => {
                                            setSearchText(e.target.value);
                                            setEventPage(1);
                                        }}
                                        style={{ width: isMobile ? '100%' : 300 }}
                                    />
                                </div>
                                <Space size={isMobile ? 'middle' : 'large'} wrap>
                                    <Checkbox 
                                        checked={showOnlySlider} 
                                        onChange={(e) => {
                                            setShowOnlySlider(e.target.checked);
                                            setEventPage(1);
                                        }}
                                    >
                                        <Tag color="magenta" style={{ cursor: 'pointer', margin: 0 }}>Slider</Tag>
                                    </Checkbox>
                                    <Checkbox 
                                        checked={showOnlyFeatured} 
                                        onChange={(e) => {
                                            setShowOnlyFeatured(e.target.checked);
                                            setEventPage(1);
                                        }}
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
                            onChange={(key) => {
                                setActiveTab(key);
                                setEventPage(1);
                            }}
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
                title={viewingEvent ? (
                    <Space>
                        <img
                            src={viewingEvent.imageUrl || 'https://via.placeholder.com/80x54?text=VN'}
                            alt=""
                            style={{ width: 56, height: 40, borderRadius: 8, objectFit: 'cover' }}
                        />
                        <div>
                            <Typography.Text strong style={{ display: 'block', maxWidth: isMobile ? 220 : 600 }} ellipsis>
                                {viewingEvent.name}
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Quản lý sự kiện #{viewingEvent.id}
                            </Typography.Text>
                        </div>
                    </Space>
                ) : null}
                open={isEventDetailVisible}
                onCancel={() => setIsEventDetailVisible(false)}
                width={isMobile ? '100%' : 1080}
                style={{ top: isMobile ? 0 : 20 }}
                footer={null}
            >
                {viewingEvent && (
                    <div>
                        <Card size="small" style={{ marginBottom: 16, borderRadius: 12 }} styles={{ body: { padding: 12 } }}>
                            <Space wrap size={[8, 8]}>
                                <Button type={detailTab === 'overview' ? 'primary' : 'default'} icon={<EyeOutlined />} onClick={() => setDetailTab('overview')}>
                                    Chi tiết
                                </Button>
                                <Button icon={<EditOutlined />} onClick={() => handleEdit(viewingEvent)}>
                                    {t('admin.edit')}
                                </Button>
                                <Button icon={<TagOutlined />} onClick={() => handleManageTickets(viewingEvent)} style={{ borderColor: '#722ed1', color: '#722ed1' }}>
                                    Loại vé
                                </Button>
                                <Button icon={<BarChartOutlined />} onClick={() => {
                                    handleViewEventStats(viewingEvent);
                                    setIsEventDetailVisible(false);
                                }}>
                                    Thống kê
                                </Button>
                                {(viewingEvent.status === 'PENDING' || viewingEvent.status === 'PENDING_EDIT') && (
                                    <>
                                        <Button type="primary" style={{ background: '#52c41a' }} onClick={() => {
                                            handleUpdateStatus(viewingEvent.id, 'APPROVED');
                                            setIsEventDetailVisible(false);
                                        }}>
                                            {t('admin.approve')}
                                        </Button>
                                        <Button danger onClick={() => {
                                            setRejectionReasonText('');
                                            setIsRejectModalVisible(true);
                                        }}>
                                            {t('admin.reject')}
                                        </Button>
                                    </>
                                )}
                                <Popconfirm
                                    title={t('admin.deleteConfirm')}
                                    onConfirm={() => handleDelete(viewingEvent.id)}
                                    okText={t('admin.yes')}
                                    cancelText={t('admin.no')}
                                >
                                    <Button danger icon={<DeleteOutlined />}>{t('admin.delete')}</Button>
                                </Popconfirm>
                            </Space>
                        </Card>

                        <Tabs
                            activeKey={detailTab}
                            onChange={setDetailTab}
                            items={[
                                {
                                    key: 'overview',
                                    label: <span><EyeOutlined /> Tổng quan</span>,
                                    children: (
                                        <Row gutter={[24, 20]}>
                                            <Col xs={24} md={9}>
                                                <Image
                                                    src={viewingEvent.imageUrl}
                                                    alt={viewingEvent.name}
                                                    style={{ width: '100%', maxHeight: 330, borderRadius: 12, objectFit: 'cover' }}
                                                    fallback="https://via.placeholder.com/600x340?text=No+Image"
                                                />
                                            </Col>
                                            <Col xs={24} md={15}>
                                                <Space wrap style={{ marginBottom: 14 }}>
                                                    <Tag color={getStatusMeta(viewingEvent.status).color}>{getStatusMeta(viewingEvent.status).text}</Tag>
                                                    <Tag color="blue">{viewingEvent.type}</Tag>
                                                    {viewingEvent.isSlider && <Tag color="magenta">Slider</Tag>}
                                                    {viewingEvent.isFeatured && <Tag color="geekblue">{t('admin.featured')}</Tag>}
                                                </Space>
                                                <Descriptions
                                                    column={isMobile ? 1 : 2}
                                                    size="small"
                                                    bordered
                                                    items={[
                                                        { key: 'organizer', label: 'Ban tổ chức', children: viewingEvent.organizerName || t('admin.notUpdated') },
                                                        { key: 'time', label: 'Thời gian', children: dayjs(viewingEvent.startTime).format('HH:mm · DD/MM/YYYY') },
                                                        { key: 'email', label: 'Email', children: viewingEvent.organizerEmail || t('admin.notUpdated') },
                                                        { key: 'phone', label: 'Điện thoại', children: viewingEvent.organizerPhone || t('admin.notUpdated') },
                                                        { key: 'location', label: 'Địa điểm', span: 2, children: viewingEvent.location || t('admin.notUpdated') },
                                                    ]}
                                                />
                                            </Col>
                                        </Row>
                                    ),
                                },
                                {
                                    key: 'description',
                                    label: <span><TagsOutlined /> Nội dung</span>,
                                    children: (
                                        <Typography.Paragraph style={{ whiteSpace: 'pre-line', fontSize: 15, lineHeight: 1.8 }}>
                                            {viewingEvent.description || 'Chưa có mô tả chi tiết.'}
                                        </Typography.Paragraph>
                                    ),
                                },
                                {
                                    key: 'tickets',
                                    label: <span><TagOutlined /> Loại vé ({viewingEvent.ticketTypes?.length || 0})</span>,
                                    children: (
                                        <Table
                                            dataSource={viewingEvent.ticketTypes || []}
                                            rowKey={(item, index) => item.id || index}
                                            pagination={false}
                                            scroll={{ x: 'max-content' }}
                                            columns={[
                                                { title: t('admin.zone'), dataIndex: 'zoneName', key: 'zoneName', render: (text) => <strong>{text}</strong> },
                                                { title: t('admin.price'), dataIndex: 'price', key: 'price', render: (price) => <span style={{ color: '#cf1322', fontWeight: 700 }}>{price?.toLocaleString()} VNĐ</span> },
                                                { title: t('admin.quantity'), dataIndex: 'totalQuantity', key: 'totalQuantity' },
                                                { title: 'Còn lại', dataIndex: 'remainingQuantity', key: 'remainingQuantity', render: (value) => <Tag color={value > 0 ? 'green' : 'red'}>{value ?? 0}</Tag> },
                                            ]}
                                        />
                                    ),
                                },
                                {
                                    key: 'images',
                                    label: <span><PictureOutlined /> Hình ảnh</span>,
                                    children: (
                                        <Image.PreviewGroup>
                                            <Row gutter={[12, 12]}>
                                                {[viewingEvent.imageUrl, ...(viewingEvent.additionalImages || [])]
                                                    .filter(Boolean)
                                                    .map((image, index) => (
                                                        <Col xs={12} sm={8} md={6} key={`${image}-${index}`}>
                                                            <Image src={image} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10 }} />
                                                        </Col>
                                                    ))}
                                            </Row>
                                        </Image.PreviewGroup>
                                    ),
                                },
                            ]}
                        />
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

            {/* ─── Ticket Type Management Modal ─── */}
            <Modal
                title={
                    <Space>
                        <TagOutlined style={{ color: '#722ed1' }} />
                        <span>{t('admin.manageTicketsTitle', 'Quản lý Loại Vé - {{name}}', { name: ticketModalEvent?.name || '' })}</span>
                    </Space>
                }
                open={isTicketModalVisible}
                onCancel={() => setIsTicketModalVisible(false)}
                width={isMobile ? '100%' : 860}
                style={{ top: isMobile ? 0 : 20 }}
                footer={[
                    <Button key="cancel" onClick={() => setIsTicketModalVisible(false)}>
                        {t('common.cancel', 'Hủy')}
                    </Button>,
                    <Button
                        key="add"
                        icon={<PlusOutlined />}
                        onClick={handleAddTicketRow}
                    >
                        {t('admin.addTicketType', 'Thêm loại vé')}
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={ticketSaving}
                        onClick={handleSaveAdminTicketTypes}
                        style={{ background: '#722ed1', borderColor: '#722ed1' }}
                    >
                        {t('admin.saveTicketTypes', 'Lưu thay đổi')}
                    </Button>
                ]}
            >
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f6f0ff', borderRadius: 8, border: '1px solid #d3adf7' }}>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        💡 <strong>Lưu ý:</strong> Thay đổi loại vé của Admin có hiệu lực ngay lập tức và không cần duyệt lại. Không thể xóa khu vực đã có người mua vé thành công.
                    </Typography.Text>
                </div>
                <Table
                    dataSource={editingTicketTypes}
                    rowKey="key"
                    pagination={false}
                    scroll={{ x: 600 }}
                    size="small"
                    columns={[
                        {
                            title: t('admin.zone', 'Khu vực'),
                            dataIndex: 'zoneName',
                            key: 'zoneName',
                            render: (val, record) => (
                                <Input
                                    value={val}
                                    onChange={e => handleTicketTypeChange(record.key, 'zoneName', e.target.value)}
                                    placeholder="VIP, GA, ..."
                                    style={{ minWidth: 100 }}
                                />
                            )
                        },
                        {
                            title: t('admin.price', 'Giá vé (VNĐ)'),
                            dataIndex: 'price',
                            key: 'price',
                            render: (val, record) => (
                                <InputNumber
                                    value={val}
                                    min={0}
                                    step={10000}
                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={v => v.replace(/,/g, '')}
                                    onChange={v => handleTicketTypeChange(record.key, 'price', v)}
                                    style={{ width: '100%', minWidth: 120 }}
                                />
                            )
                        },
                        {
                            title: t('admin.quantity', 'Tổng SL'),
                            dataIndex: 'totalQuantity',
                            key: 'totalQuantity',
                            render: (val, record) => (
                                <Tooltip title={record.sold > 0 ? `Đã bán: ${record.sold}, không thể giảm xuống dưới ${record.sold}` : ''}>
                                    <InputNumber
                                        value={val}
                                        min={record.sold || 0}
                                        onChange={v => handleTicketTypeChange(record.key, 'totalQuantity', v)}
                                        style={{ width: '100%', minWidth: 90 }}
                                    />
                                </Tooltip>
                            )
                        },
                        {
                            title: t('admin.soldCol', 'Đã bán'),
                            dataIndex: 'sold',
                            key: 'sold',
                            render: val => <Tag color={val > 0 ? 'orange' : 'default'}>{val || 0}</Tag>
                        },
                        {
                            title: t('admin.remainingCol', 'Còn lại'),
                            dataIndex: 'remainingQuantity',
                            key: 'remainingQuantity',
                            render: val => <Tag color={val > 0 ? 'green' : 'red'}>{val}</Tag>
                        },
                        {
                            title: '',
                            key: 'action',
                            width: 60,
                            render: (_, record) => (
                                <Tooltip title={record.sold > 0 ? 'Không thể xóa khu vực đã có người mua thành công' : 'Xóa khu vực này'}>
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        disabled={record.sold > 0}
                                        onClick={() => handleDeleteTicketRow(record.key)}
                                    />
                                </Tooltip>
                            )
                        }
                    ]}
                />
            </Modal>
        </div>
    );
};

export default Admin;
