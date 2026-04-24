import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, message, Space, Upload, Tag, Statistic, Row, Col, Card, Typography, Image, Divider, Tabs, Badge, Alert, Grid, Empty, Tooltip } from 'antd';
import { PlusOutlined, UploadOutlined, EditOutlined, BarChartOutlined, UserOutlined, EnvironmentOutlined, ClockCircleOutlined, MailOutlined, PhoneOutlined, TagsOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined, SaveOutlined, TagOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import EventFormModal from '../components/EventFormModal';
import { AuthContext } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title: TypographyTitle } = Typography;

const MobileEventCard = ({ event, onClick, onEdit, onStats, t }) => {
    const statusColor = event.status === 'APPROVED' ? 'green' : (event.status === 'PENDING' ? 'gold' : (event.status === 'PENDING_EDIT' ? 'orange' : 'red'));
    const statusText = event.status === 'APPROVED' ? t('myEvents.approved', 'Đã duyệt') 
                     : event.status === 'PENDING' ? t('myEvents.pendingStatus', 'Chờ duyệt')
                     : event.status === 'PENDING_EDIT' ? t('myEvents.pendingEdit', 'Chờ duyệt (Chỉnh sửa)')
                     : t('myEvents.rejected', 'Từ chối');

    return (
        <Card 
            size="small" 
            style={{ marginBottom: '16px', borderRadius: '16px', borderLeft: `5px solid ${statusColor === 'green' ? '#52c41a' : (statusColor === 'gold' ? '#faad14' : '#ff4d4f')}`, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            bodyStyle={{ padding: '16px' }}
        >
            <div onClick={onClick} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <Text strong style={{ fontSize: '16px', color: '#1f1f1f', flex: 1, marginRight: '8px' }}>{event.name}</Text>
                    <Tag color={statusColor} style={{ margin: 0, borderRadius: '4px' }}>{statusText}</Tag>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    <Text type="secondary" style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                        <EnvironmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} /> {event.location}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                        <ClockCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} /> {formatDate(event.startTime)}
                    </Text>
                </div>
            </div>
            
            <Divider style={{ margin: '0 0 12px 0' }} />
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button 
                    size="small" 
                    icon={<EditOutlined />} 
                    onClick={(e) => { e.stopPropagation(); onEdit(event); }} 
                    style={{ borderRadius: '6px' }}
                >
                    {t('common.edit', 'Sửa')}
                </Button>
                {event.status === 'APPROVED' && (
                    <Button 
                        size="small" 
                        type="primary" 
                        ghost
                        icon={<BarChartOutlined />} 
                        onClick={(e) => { e.stopPropagation(); onStats(event); }} 
                        style={{ borderRadius: '6px' }}
                    >
                        {t('myEvents.viewStats', 'Thống kê')}
                    </Button>
                )}
            </div>
        </Card>
    );
};

const MyEvents = () => {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [events, setEvents] = useState([]);
    const [approvedEvents, setApprovedEvents] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [rejectedEvents, setRejectedEvents] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isEventDetailVisible, setIsEventDetailVisible] = useState(false);
    const [viewingEvent, setViewingEvent] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('APPROVED');

    const [form] = Form.useForm();
    const { user } = useContext(AuthContext);
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Ticket type management state
    const [isTicketModalVisible, setIsTicketModalVisible] = useState(false);
    const [editingTicketTypes, setEditingTicketTypes] = useState([]);
    const [ticketModalEvent, setTicketModalEvent] = useState(null);
    const [ticketSaving, setTicketSaving] = useState(false);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/events/my?page=0&size=1000');
            const allEvents = response.data.content || [];
            allEvents.sort((a, b) => b.id - a.id);
            
            setEvents(allEvents);
            setApprovedEvents(allEvents.filter(e => e.status === 'APPROVED'));
            setPendingEvents(allEvents.filter(e => e.status === 'PENDING' || e.status === 'PENDING_EDIT'));
            setRejectedEvents(allEvents.filter(e => e.status === 'REJECTED'));
        } catch (error) {
            message.error(t('myEvents.loadError', 'Lỗi khi tải danh sách sự kiện'));
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
        } catch (error) {
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
            fetchMyEvents();
        } catch (error) {
            message.error(error.response?.data?.message || t('myEvents.ticketUpdatedError', 'Lỗi khi cập nhật loại vé'));
        } finally {
            setTicketSaving(false);
        }
    };

    const columns = [
        {
            title: t('myEvents.eventName', 'Tên Sự Kiện'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: t('myEvents.location', 'Địa Điểm'),
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: t('myEvents.time', 'Thời Gian'),
            dataIndex: 'startTime',
            key: 'startTime',
            render: (time) => formatDate(time),
        },
        {
            title: t('myEvents.status', 'Trạng Thái'),
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'APPROVED' ? 'green' : (status === 'PENDING' ? 'gold' : (status === 'PENDING_EDIT' ? 'orange' : 'red'));
                let text = status === 'APPROVED' ? t('myEvents.approved', 'Đã duyệt') 
                         : status === 'PENDING' ? t('myEvents.pendingStatus', 'Chờ duyệt')
                         : status === 'PENDING_EDIT' ? t('myEvents.pendingEdit', 'Chờ duyệt (Chỉnh sửa)')
                         : t('myEvents.rejected', 'Từ chối');
                return <Tag color={color}>{text}</Tag>;
            }
        }
    ];

    const renderEvents = (eventList) => {
        if (isMobile) {
            return (
                <div style={{ paddingTop: '12px' }}>
                    {eventList.length === 0 ? (
                        <Empty description={t('myEvents.noEvents', 'Chưa có sự kiện nào')} />
                    ) : (
                        eventList.map(event => (
                            <MobileEventCard 
                                key={event.id} 
                                event={event} 
                                onClick={() => handleViewEventDetail(event)} 
                                onEdit={handleEditClick}
                                onStats={handleViewEventStats}
                                t={t} 
                            />
                        ))
                    )}
                </div>
            );
        }
        return (
            <Table
                columns={columns}
                dataSource={eventList}
                rowKey="id"
                loading={loading}
                onRow={(record) => ({ onClick: () => handleViewEventDetail(record), style: { cursor: 'pointer' } })}
            />
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
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => navigate('/create-event')}
                    block={isMobile}
                    size={isMobile ? 'middle' : 'large'}
                >
                    {t('myEvents.createEvent', 'Tạo Sự Kiện Mới')}
                </Button>
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
