import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Divider, Empty, Form, Grid, Image, Input, InputNumber, message, Modal, Row, Space, Spin, Table, Tabs, Tag, Tooltip, Typography } from 'antd';
import { BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined, ExclamationCircleOutlined, EyeOutlined, PlusOutlined, SaveOutlined, TagOutlined, TagsOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import EventFormModal from '../components/EventFormModal';
import { formatDate } from '../utils/formatters';
import dayjs from 'dayjs';
import { ThemeContext } from '../context/ThemeContext';

const { Text } = Typography;

const ManagementEventCard = ({ event, onClick, onEdit, onManageTickets, onStats, t, isMobile, isDark }) => {
    const statusColor = event.status === 'APPROVED' ? 'green' : (event.status === 'PENDING' ? 'gold' : (event.status === 'PENDING_EDIT' ? 'orange' : 'red'));
    const statusText = event.status === 'APPROVED' ? t('myEvents.approved', 'Đã duyệt')
                     : event.status === 'PENDING' ? t('myEvents.pendingStatus', 'Chờ duyệt')
                     : event.status === 'PENDING_EDIT' ? t('myEvents.pendingEdit', 'Chờ duyệt (Chỉnh sửa)')
                     : t('myEvents.rejected', 'Từ chối');
    const sold = (event.ticketTypes || []).reduce(
        (total, ticket) => total + Math.max(0, ticket.totalQuantity - (ticket.remainingQuantity ?? ticket.totalQuantity)),
        0,
    );

    return (
        <Card
            hoverable
            onClick={onClick}
            styles={{ body: { padding: 0 } }}
            style={{ borderRadius: 16, overflow: 'hidden' }}
        >
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '280px minmax(0, 1fr) 250px',
                minHeight: isMobile ? 'auto' : 184,
            }}>
                <div style={{
                    height: isMobile ? 180 : '100%',
                    minHeight: 180,
                    position: 'relative',
                    overflow: 'hidden',
                    background: isDark ? '#1f1f1f' : '#f5f5f5',
                }}>
                    <img
                        src={event.imageUrl || 'https://via.placeholder.com/600x340?text=VNTicket'}
                        alt={event.name}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,.55) 100%)',
                    }} />
                    <Tag color={statusColor} style={{ position: 'absolute', top: 12, left: 12, margin: 0 }}>
                        {statusText}
                    </Tag>
                </div>

                <div style={{
                    padding: isMobile ? 16 : '18px 22px',
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12,
                        marginBottom: 12,
                    }}>
                        <Typography.Title level={4} ellipsis={{ rows: 2 }} style={{ margin: 0, lineHeight: 1.35 }}>
                            {event.name}
                        </Typography.Title>
                        <Text type="secondary" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>#{event.id}</Text>
                    </div>

                    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                        <Text type="secondary" ellipsis>
                            <ClockCircleOutlined /> {formatDate(event.startTime)}
                        </Text>
                        <Text type="secondary" ellipsis>
                            <EnvironmentOutlined /> {event.location || 'Chưa cập nhật địa điểm'}
                        </Text>
                        <Space wrap size={[4, 4]}>
                            <Tag color="blue">{event.type || 'Khác'}</Tag>
                            {event.isSlider && <Tag color="magenta">Slider</Tag>}
                            {event.isFeatured && <Tag color="geekblue">{t('admin.featured', 'Nổi bật')}</Tag>}
                        </Space>
                    </Space>
                </div>

                <div style={{
                    padding: 18,
                    borderLeft: isMobile ? 'none' : `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                    borderTop: isMobile ? `1px solid ${isDark ? '#303030' : '#f0f0f0'}` : 'none',
                    background: isDark ? '#181818' : '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        gap: 12,
                    }}>
                        <div>
                            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>ĐÃ BÁN</Text>
                            <Typography.Title level={4} style={{ margin: '2px 0 0' }}>{sold} vé</Typography.Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {(event.ticketTypes || []).length} loại vé
                        </Text>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Space.Compact block>
                            <Tooltip title={t('common.edit', 'Chỉnh sửa')}>
                                <Button
                                    icon={<EditOutlined />}
                                    onClick={(clickEvent) => {
                                        clickEvent.stopPropagation();
                                        onEdit(event);
                                    }}
                                />
                            </Tooltip>
                            {event.status === 'APPROVED' && (
                                <Button
                                    icon={<TagOutlined />}
                                    style={{ flex: 1 }}
                                    onClick={(clickEvent) => {
                                        clickEvent.stopPropagation();
                                        onManageTickets(event);
                                    }}
                                >
                                    Loại vé
                                </Button>
                            )}
                            {event.status === 'APPROVED' && (
                                <Tooltip title={t('myEvents.viewStats', 'Xem thống kê')}>
                                    <Button
                                        icon={<BarChartOutlined />}
                                        onClick={(clickEvent) => {
                                            clickEvent.stopPropagation();
                                            onStats(event);
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </Space.Compact>
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            block
                            onClick={(clickEvent) => {
                                clickEvent.stopPropagation();
                                onClick();
                            }}
                        >
                            Quản lý
                        </Button>
                    </div>
                    {event.status === 'PENDING_EDIT' && (
                        <Text type="warning" style={{ fontSize: 12 }}>
                            Thay đổi đang chờ Admin duyệt lại
                        </Text>
                    )}
                </div>
            </div>
        </Card>
    );
};

const MyEvents = () => {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isEventDetailVisible, setIsEventDetailVisible] = useState(false);
    const [viewingEvent, setViewingEvent] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('APPROVED');

    const [form] = Form.useForm();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isDark } = useContext(ThemeContext);
    const approvedEvents = useMemo(
        () => events.filter(event => event.status === 'APPROVED'),
        [events],
    );
    const pendingEvents = useMemo(
        () => events.filter(event => event.status === 'PENDING' || event.status === 'PENDING_EDIT'),
        [events],
    );
    const rejectedEvents = useMemo(
        () => events.filter(event => event.status === 'REJECTED'),
        [events],
    );

    // Ticket type management state
    const [isTicketModalVisible, setIsTicketModalVisible] = useState(false);
    const [editingTicketTypes, setEditingTicketTypes] = useState([]);
    const [ticketModalEvent, setTicketModalEvent] = useState(null);
    const [ticketSaving, setTicketSaving] = useState(false);

    const fetchMyEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/events/my?page=0&size=1000');
            const allEvents = response.data.content || [];
            allEvents.sort((a, b) => b.id - a.id);
            setEvents(allEvents);
        } catch {
            message.error(t('myEvents.loadError', 'Lỗi khi tải danh sách sự kiện'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchMyEvents();
    }, [fetchMyEvents]);

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

            await axiosClient.post('/events/my', eventData);
            message.success(t('myEvents.createSuccess', 'Tạo sự kiện thành công!'));
            setIsCreateModalVisible(false);
            form.resetFields();
            fetchMyEvents();
        } catch (error) {
            if (!error.errorFields) message.error(error.response?.data?.message || t('myEvents.createError', 'Lỗi tạo sự kiện'));
        }
    };

    const handleEditSubmit = async () => {
        try {
            const values = await form.validateFields();
            const combinedLocation = [values.detailAddress, values.ward, values.province].filter(Boolean).join(', ');
            const payload = {
                ...values,
                location: combinedLocation,
                startTime: values.startTime.format('YYYY-MM-DDTHH:mm:ss'),
                additionalImages: values.additionalImages?.map(item => item?.url || item) || [],
                // Note: Ticket types are not submitted for updates
            };

            delete payload.province;
            delete payload.ward;
            delete payload.detailAddress;

            await axiosClient.put(`/events/my/${editingEvent.id}`, payload);
            message.success(t('myEvents.editSuccess', 'Cập nhật sự kiện thành công! Chờ Admin phê duyệt.'));
            setIsEditModalVisible(false);
            form.resetFields();
            fetchMyEvents();
        } catch (error) {
            if (!error.errorFields) message.error(error.response?.data?.message || t('myEvents.editError', 'Lỗi cập nhật sự kiện'));
        }
    };

    const handleViewEventStats = (record) => {
        navigate(`/my-events/stats/${record.id}`);
    };

    const handleViewEventDetail = (record) => {
        setViewingEvent(record);
        setIsEventDetailVisible(true);
    };

    const handleAcknowledgeRejection = async (eventId) => {
        try {
            await axiosClient.delete(`/events/my/${eventId}`);
            message.success(t('myEvents.deleteSuccess', 'Đã xác nhận và xóa sự kiện'));
            setIsEventDetailVisible(false);
            setViewingEvent(null);
            fetchMyEvents();
            window.dispatchEvent(new CustomEvent('user-event-read'));
        } catch {
            message.error(t('myEvents.deleteError', 'Lỗi khi xóa sự kiện'));
        }
    };

    const handleEditClick = (record) => {
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
        });
        setIsEditModalVisible(true);
    };

    // ─── Ticket Type Management ───
    const handleManageMyTickets = (event) => {
        setIsEventDetailVisible(false);
        setTicketModalEvent(event);
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
            if (field === 'totalQuantity') {
                updated.remainingQuantity = Math.max(0, value - (tt.sold || 0));
            }
            return updated;
        }));
    };

    const handleDeleteMyTicketRow = (key) => {
        setEditingTicketTypes(prev => prev.filter(tt => tt.key !== key));
    };

    const handleSaveMyTicketTypes = async () => {
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
            await axiosClient.put(`/events/my/${ticketModalEvent.id}/ticket-types`, payload);
            message.success(t('myEvents.ticketUpdatedSuccess', 'Cập nhật loại vé thành công! Đã gửi yêu cầu chờ Admin duyệt lại.'));
            setIsTicketModalVisible(false);
            setTicketModalEvent(null);
            setActiveTab('PENDING');
            await fetchMyEvents();
        } catch (error) {
            message.error(error.response?.data?.message || t('myEvents.ticketUpdatedError', 'Lỗi khi cập nhật loại vé'));
        } finally {
            setTicketSaving(false);
        }
    };

    const renderEvents = (eventList) => {
        return (
            <Spin spinning={loading}>
                <div style={{ paddingTop: 12 }}>
                    {eventList.length === 0 ? (
                        <Empty description={t('myEvents.noEvents', 'Chưa có sự kiện nào')} style={{ padding: '42px 0' }} />
                    ) : (
                        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                            {eventList.map(event => (
                                <ManagementEventCard
                                    key={event.id}
                                    event={event}
                                    onClick={() => handleViewEventDetail(event)}
                                    onEdit={handleEditClick}
                                    onManageTickets={handleManageMyTickets}
                                    onStats={handleViewEventStats}
                                    t={t}
                                    isMobile={isMobile}
                                    isDark={isDark}
                                />
                            ))}
                        </Space>
                    )}
                </div>
            </Spin>
        );
    };

    return (
        <div style={{ padding: isMobile ? '0 16px' : 0 }}>
            <div style={{ 
                marginBottom: 24, 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '12px' : 0
            }}>
                <h2 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px' }}>{t('myEvents.title', 'Danh sách sự kiện của bạn')}</h2>
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
                items={[
                    {
                        label: <span><CheckCircleOutlined /> {isMobile ? '' : t('myEvents.approved', 'Đã duyệt')} ({approvedEvents.length})</span>,
                        key: 'APPROVED',
                        children: renderEvents(approvedEvents)
                    },
                    {
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ExclamationCircleOutlined /> {isMobile ? '' : t('myEvents.pendingProcess', 'Chờ xử lý')}
                                <Badge count={pendingEvents.length} showZero={false} />
                            </span>
                        ),
                        key: 'PENDING',
                        children: renderEvents(pendingEvents)
                    },
                    {
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CloseCircleOutlined /> {isMobile ? '' : t('myEvents.rejected', 'Từ chối')}
                                <Badge count={rejectedEvents.length} showZero={false} />
                            </span>
                        ),
                        key: 'REJECTED',
                        children: renderEvents(rejectedEvents)
                    }
                ]}
            />

            {/* Create Event Modal (Unused directly if navigating, but kept for legacy) */}
            <EventFormModal
                title={t('myEvents.createEventPending', 'Tạo Sự Kiện (Chờ Duyệt)')}
                visible={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                onOk={handleCreateEvent}
                form={form}
                editingEvent={false}
                isUser={true}
            />

            {/* Edit Event Modal */}
            <EventFormModal
                title={t('myEvents.editEvent', 'Chỉnh sửa sự kiện')}
                visible={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                onOk={handleEditSubmit}
                form={form}
                editingEvent={true}
                isUser={true}
            />

            {/* Event Detailed View Modal */}
            <Modal
                title={t('admin.eventDetails', { name: viewingEvent?.name || '' })}
                open={isEventDetailVisible}
                onCancel={() => setIsEventDetailVisible(false)}
                width={1000}
                style={{ top: 20 }}
                footer={viewingEvent ? (
                    viewingEvent.status === 'REJECTED' ? [
                        <Button key="ack" type="primary" danger onClick={() => handleAcknowledgeRejection(viewingEvent.id)}>
                            {t('myEvents.acknowledge', 'Xác nhận và xóa')}
                        </Button>
                    ] : [
                        <Button
                            key="edit"
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleEditClick(viewingEvent)}
                        >
                            {t('common.edit', 'Chỉnh sửa')}
                        </Button>,
                        viewingEvent.status === 'APPROVED' && (
                            <Button
                                key="manage-tickets"
                                type="default"
                                icon={<TagOutlined />}
                                onClick={() => handleManageMyTickets(viewingEvent)}
                                style={{ borderColor: '#722ed1', color: '#722ed1' }}
                            >
                                {t('myEvents.manageTickets', 'Quản lý Loại Vé')}
                            </Button>
                        ),
                        viewingEvent.status === 'APPROVED' && (
                            <Button
                                key="stats"
                                icon={<BarChartOutlined />}
                                onClick={() => { handleViewEventStats(viewingEvent); setIsEventDetailVisible(false); }}
                            >
                                {t('myEvents.viewStats', 'Xem Thống Kê')}
                            </Button>
                        )
                    ]
                ) : null}
            >
                {viewingEvent && (
                    <div style={{ padding: '20px 0' }}>
                        {viewingEvent.status === 'REJECTED' && viewingEvent.rejectionReason && (
                            <Alert
                                message={t('myEvents.rejectedTitle', 'Sự kiện bị từ chối')}
                                description={viewingEvent.rejectionReason}
                                type="error"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}
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
                                        <Typography.Title level={5}>{t('admin.relatedImages', 'Ảnh liên quan')}</Typography.Title>
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
                            <Col xs={24} md={14}>
                                <Typography.Title level={2}>{viewingEvent.name}</Typography.Title>
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <Typography.Paragraph>
                                        <TagsOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>{t('admin.category', 'Thể loại')}</strong> <Tag color="blue">{viewingEvent.type}</Tag>
                                    </Typography.Paragraph>
                                    <Typography.Paragraph>
                                        <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>{t('admin.location', 'Địa điểm')}</strong> {viewingEvent.location}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph>
                                        <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <strong>{t('admin.time', 'Thời gian')}</strong> {dayjs(viewingEvent.startTime).format('HH:mm - DD/MM/YYYY')}
                                    </Typography.Paragraph>
                                </Space>

                                <Divider />
                                <Typography.Title level={4}>{t('admin.detailedDesc', 'Mô tả chi tiết')}</Typography.Title>
                                <Typography.Paragraph style={{ whiteSpace: 'pre-line' }}>{viewingEvent.description}</Typography.Paragraph>

                                <Divider />
                                <Typography.Title level={4}>{t('admin.expectedPrices', 'Bảng Giá Vé')}</Typography.Title>
                                <Table
                                    dataSource={viewingEvent.ticketTypes || []}
                                    rowKey={(item, index) => item.id || index}
                                    pagination={false}
                                    size={isMobile ? 'small' : 'default'}
                                    scroll={{ x: 'max-content' }}
                                    columns={[
                                        { title: t('admin.zone', 'Khu vực'), dataIndex: 'zoneName', key: 'zoneName', render: (text) => <strong>{text}</strong> },
                                        { title: t('admin.price', 'Giá vé'), dataIndex: 'price', key: 'price', render: (price) => <span style={{ color: '#cf1322', fontWeight: 'bold' }}>{price?.toLocaleString()} VNĐ</span> },
                                        { title: t('admin.quantity', 'Số lượng'), dataIndex: 'totalQuantity', key: 'totalQuantity' }
                                    ]}
                                />
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>

            {/* ─── Ticket Type Management Modal (User/Organizer) ─── */}
            <Modal
                title={
                    <Space>
                        <TagOutlined style={{ color: '#722ed1' }} />
                        <span>{t('myEvents.manageTicketsTitle', 'Quản lý Loại Vé - {{name}}', { name: ticketModalEvent?.name || '' })}</span>
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
                        {t('myEvents.addTicketType', 'Thêm loại vé')}
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={ticketSaving}
                        onClick={handleSaveMyTicketTypes}
                        style={{ background: '#722ed1', borderColor: '#722ed1' }}
                    >
                        {t('myEvents.saveTicketTypes', 'Gửi yêu cầu')}
                    </Button>
                ]}
            >
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="Lưu ý"
                    description="Sau khi chỉnh sửa loại vé, sự kiện sẽ chuyển sang trạng thái chờ Admin duyệt lại. Trong thời gian đó, vé sẽ tạm dừng bán. Không thể xóa khu vực đã có người mua vé thành công."
                />
                <Table
                    dataSource={editingTicketTypes}
                    rowKey="key"
                    pagination={false}
                    scroll={{ x: 600 }}
                    size="small"
                    columns={[
                        {
                            title: 'Khu vực',
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
                            title: 'Giá vé (VNĐ)',
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
                            title: 'Tổng số lượng',
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
                            title: 'Đã bán',
                            dataIndex: 'sold',
                            key: 'sold',
                            render: val => <Tag color={val > 0 ? 'orange' : 'default'}>{val || 0}</Tag>
                        },
                        {
                            title: 'Còn lại',
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
                                        onClick={() => handleDeleteMyTicketRow(record.key)}
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

export default MyEvents;
