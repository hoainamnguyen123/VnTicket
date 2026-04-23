import React, { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Row, Col, Typography, Card, Button, InputNumber, Divider, Table, Tag, message, Skeleton, Modal, Switch, Image, Alert, Grid } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarOutlined, EnvironmentOutlined, CheckCircleOutlined, ExclamationCircleOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import axiosClient from '../api/axiosClient';
import FeaturedEventCard from '../components/FeaturedEventCard';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AuthContext } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const queryClient = useQueryClient();

    // Auto cuộn lên đầu mỗi khi Đổi sự kiện
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isSuccessVisible, setIsSuccessVisible] = useState(false);
    const [isBookingInView, setIsBookingInView] = useState(false);

    // Fetch Event bằng useQuery
    const { data: event, isLoading: loading } = useQuery({
        queryKey: ['event', id],
        queryFn: async () => {
            const response = await axiosClient.get(`/events/${id}`);
            return response.data;
        }
    });

    // Fetch Related Events
    const { data: relatedEvents = [] } = useQuery({
        queryKey: ['relatedEvents', id],
        queryFn: async () => {
            const relatedRes = await axiosClient.get(`/events?page=0&size=50`);
            const allEvents = relatedRes.data?.content || [];
            const filtered = allEvents.filter(e => Number(e.id) !== Number(id));
            
            // Ưu tiên sự kiện chưa diễn ra, sau đó mới đến sự kiện đã diễn ra
            return filtered.sort((a, b) => {
                const nowVal = new Date();
                const aTime = new Date(a.startTime);
                const bTime = new Date(b.startTime);
                const aIsFuture = aTime >= nowVal;
                const bIsFuture = bTime >= nowVal;

                if (aIsFuture && !bIsFuture) return -1;
                if (!aIsFuture && bIsFuture) return 1;

                // Nếu cùng trạng thái, trộn ngẫu nhiên một chút để tạo sự đa dạng
                return Math.random() - 0.5;
            }).slice(0, 8);
        },
        enabled: !!event // Bật khi event đã tồn tại
    });

    // Observer để ẩn hiện nút "Mua vé ngay" ở bottom
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsBookingInView(entry.isIntersecting);
            },
            { threshold: 0 } // Bất kỳ phần nào hiện ra là ẩn nút ngay
        );

        const bookingCard = document.getElementById('booking-card');
        if (bookingCard) {
            observer.observe(bookingCard);
        }

        return () => {
            if (bookingCard) {
                observer.unobserve(bookingCard);
            }
        };
    }, [loading, isMobile]); // Chạy lại khi data đã load xong hoặc đổi chế độ mobile

    const showConfirmModal = () => {
        if (!user) {
            message.warning(t('eventDetail.loginRequired'));
            navigate('/login');
            return;
        }

        if (!selectedTicket) {
            message.warning(t('eventDetail.selectTicket'));
            return;
        }
        setIsConfirmVisible(true);
    };

    // Thao tác Mua Vé qua Mutation
    const bookingMutation = useMutation({
        mutationFn: async (payload) => {
            return await axiosClient.post('/bookings', payload);
        },
        onSuccess: () => {
            // Xóa rác, ép Hệ thống tải lại Số lượng Vé Mới Nhất ngay lập tức sau khi trừ vé!
            queryClient.invalidateQueries({ queryKey: ['event', id] });
            queryClient.invalidateQueries({ queryKey: ['events'] });

            setIsConfirmVisible(false);
            setIsSuccessVisible(true);
        },
        onError: (error) => {
            let errorMsg = error.message;
            if (errorMsg === "Invalid ticket quantity! You can only purchase a maximum of 5 tickets per order.") {
                errorMsg = t('eventDetail.maxQuantityError');
            } else if (errorMsg === "You already have a pending booking for this event. Please pay or cancel it before creating a new one.") {
                errorMsg = t('eventDetail.pendingExistsError');
            } else {
                errorMsg = errorMsg || t('eventDetail.bookingError');
            }

            message.error(errorMsg);

            if (error.status === 409) {
                Modal.error({
                    title: t('eventDetail.ticketChanged'),
                    content: t('eventDetail.ticketChangedContent'),
                    onOk: () => queryClient.invalidateQueries({ queryKey: ['event', id] }) // Load lại vé
                });
            }
        }
    });

    const handleConfirmBooking = () => {
        bookingMutation.mutate({
            eventId: event.id,
            ticketTypeId: selectedTicket.id,
            quantity: quantity
        });
    };

    const isEnded = event ? new Date(event.startTime) <= new Date() : false;

    const columns = [
        { title: t('eventDetail.zone'), dataIndex: 'zoneName', key: 'zoneName', render: text => <strong style={{ color: '#1890ff' }}>{text}</strong> },
        { title: t('eventDetail.ticketPrice'), dataIndex: 'price', key: 'price', render: price => <strong>{formatCurrency(price)}</strong> },
        {
            title: t('eventDetail.remaining'), dataIndex: 'remainingQuantity', key: 'remainingQuantity', render: qty => (
                <Tag color={qty > 0 ? 'green' : 'red'}>{qty > 0 ? `${qty} ${t('common.tickets')}` : t('common.soldOut')}</Tag>
            )
        },
        {
            title: t('eventDetail.select'),
            key: 'action',
            render: (_, record) => (
                <Switch
                    checked={selectedTicket?.id === record.id}
                    onChange={(checked) => setSelectedTicket(checked ? record : null)}
                    disabled={record.remainingQuantity <= 0 || isEnded}
                />
            ),
        },
    ];

    if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;
    if (!event) return <div style={{ textAlign: 'center', marginTop: 50 }}>{t('eventDetail.notFound')}</div>;

    const now = new Date();
    const eventDate = new Date(event.startTime);
    
    let statusBadge = null;
    if (eventDate <= now) {
        statusBadge = <Tag color="default" style={{ borderRadius: '4px', margin: 0, fontWeight: 500 }}>{t('common.ended', '✅ Đã diễn ra')}</Tag>;
    }

    /* ── Helper to render Ticket Selection Section ── */
    const renderBookingSection = () => (
        <Card 
            id="booking-card" 
            title={t('eventDetail.selectTicketType')} 
            bordered={false} 
            style={{ 
                background: isDark ? '#262626' : '#f9f9f9', 
                borderRadius: '12px',
                boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
                border: isMobile ? `1px solid ${isDark ? '#434343' : '#f0f0f0'}` : 'none'
            }}
        >
            {!isMobile ? (
                <Table
                    dataSource={event.ticketTypes}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {event.ticketTypes?.map((record) => (
                        <div 
                            key={record.id} 
                            onClick={() => record.remainingQuantity > 0 && !isEnded && setSelectedTicket(selectedTicket?.id === record.id ? null : record)}
                            style={{ 
                                padding: '16px', 
                                borderRadius: '10px', 
                                cursor: record.remainingQuantity > 0 && !isEnded ? 'pointer' : 'not-allowed',
                                border: `2px solid ${selectedTicket?.id === record.id ? '#1890ff' : (isDark ? '#434343' : '#f0f0f0')}`,
                                background: selectedTicket?.id === record.id ? (isDark ? 'rgba(24, 144, 255, 0.15)' : '#e6f7ff') : (isDark ? '#1f1f1f' : '#fff'),
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.3s ease'
                            }}
                        >
                           <div style={{ flex: 1 }}>
                             <Text strong style={{ fontSize: '15px', color: record.id === selectedTicket?.id ? '#1890ff' : (isDark ? '#e8e8e8' : '#262626'), display: 'block', marginBottom: '4px' }}>
                                {record.zoneName}
                             </Text>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <Text strong style={{ color: '#f5222d', fontSize: '15px' }}>{formatCurrency(record.price)}</Text>
                                <Tag color={record.remainingQuantity > 0 ? 'green' : 'red'} style={{ borderRadius: '4px', margin: 0, fontSize: '11px' }}>
                                    {record.remainingQuantity > 0 ? `${record.remainingQuantity} ${t('common.tickets')}` : t('common.soldOut')}
                                </Tag>
                             </div>
                           </div>
                           <div onClick={(e) => e.stopPropagation()}>
                                <Switch
                                    checked={selectedTicket?.id === record.id}
                                    onChange={(checked) => setSelectedTicket(checked ? record : null)}
                                    disabled={record.remainingQuantity <= 0 || isEnded}
                                />
                           </div>
                        </div>
                    ))}
                </div>
            )}

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Text strong>{t('eventDetail.quantity')} </Text>
                    <InputNumber
                        min={1}
                        max={selectedTicket ? Math.min(selectedTicket.remainingQuantity, 5) : 5}
                        value={quantity}
                        onChange={setQuantity}
                        disabled={!selectedTicket}
                    />
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>{t('eventDetail.total')} </Text>
                    <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: '#f5222d' }}>
                        {selectedTicket ? formatCurrency(selectedTicket.price * quantity) : '0 ₫'}
                    </Title>
                </div>
            </div>

            {isEnded && (
                <Alert
                    message={t('eventDetail.eventEndedMsg', 'Sự kiện này đã diễn ra. Bạn không thể đặt vé nữa.')}
                    type="warning"
                    showIcon
                    style={{ marginTop: '20px', borderRadius: '8px' }}
                />
            )}

            <Button
                type="primary"
                size="large"
                block
                style={{ marginTop: '20px', height: '50px', fontSize: '16px', borderRadius: '8px', fontWeight: 600, background: 'linear-gradient(135deg, #1890ff, #722ed1)', border: 'none' }}
                onClick={showConfirmModal}
                loading={bookingMutation.isPending}
                disabled={!selectedTicket || isEnded}
            >
                {isEnded ? t('eventDetail.eventEndedBtn', 'SỰ KIỆN ĐÃ DIỄN RA') : t('eventDetail.bookNow')}
            </Button>
        </Card>
    );

    return (
        <div className="event-detail-page">
            <Row gutter={[32, 32]}>
                <Col xs={24} md={12} style={{ padding: isMobile ? 0 : undefined }}>
                    <Image.PreviewGroup>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <Image
                                src={event.imageUrl}
                                alt={event.name}
                                style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                            />
                        </div>

                        <style>
                            {`
                                .hide-image-mask .ant-image-mask {
                                    opacity: 0 !important;
                                    background: transparent !important;
                                    display: none !important;
                                }
                                .hide-image-mask img {
                                    cursor: pointer !important;
                                }
                                .custom-scrollbar::-webkit-scrollbar {
                                    width: 6px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-track {
                                    background: transparent;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb {
                                    background-color: ${isDark ? '#434343' : '#bfbfbf'};
                                    border-radius: 10px;
                                }
                                @media (min-width: 768px) {
                                    .mobile-sticky-bottom-bar {
                                        display: none !important;
                                    }
                                }
                                @media (max-width: 767px) {
                                    .event-detail-page {
                                        padding-bottom: 80px;
                                    }
                                }
                            `}
                        </style>
                        {event.additionalImages && event.additionalImages.length > 0 && (
                            <div className="custom-scrollbar" style={{
                                marginTop: '24px',
                                maxHeight: '600px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                border: isDark ? '1px solid #434343' : '1px solid #d9d9d9',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                padding: '12px'
                            }}>
                                {event.additionalImages.map((imgUrl, index) => (
                                    <Image
                                        key={index}
                                        src={imgUrl}
                                        alt={`${t('eventDetail.additionalImage')} ${index + 1}`}
                                        style={{ width: '100%', display: 'block' }}
                                        rootClassName="hide-image-mask"
                                    />
                                ))}
                            </div>
                        )}
                    </Image.PreviewGroup>
                </Col>
                <Col xs={24} md={12} style={{ padding: isMobile ? '0 24px' : undefined }}>
                    <div style={{ marginBottom: 16 }}>
                        <Tag color={event.type === 'CONCERT' ? 'magenta' : 'geekblue'}>
                            {event.type}
                        </Tag>
                        {statusBadge}
                    </div>
                    <Title level={2} style={{ marginTop: 0 }}>{event.name}</Title>

                    <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '16px' }}>
                        <Text><CalendarOutlined style={{ color: '#1890ff', marginRight: 10 }} /> <strong>{t('eventDetail.time')}</strong> {formatDate(event.startTime)}</Text>
                        <Text><UserOutlined style={{ color: '#1890ff', marginRight: 10 }} /> <strong>{t('eventDetail.organizer')}</strong> {event.organizerName || t('common.notUpdated')}</Text>
                        <Text><EnvironmentOutlined style={{ color: '#1890ff', marginRight: 10 }} /> <strong>{t('eventDetail.location')}</strong> {event.location || t('common.notUpdated')}</Text>
                    </div>

                    {!isMobile && (
                        renderBookingSection()
                    )}
                </Col>
            </Row>

            {isMobile && (
                <div style={{ padding: '0 24px' }}>
                    <Divider orientation="left"><Title level={3}>{t('eventDetail.eventIntro')}</Title></Divider>
                    <div style={{ fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                        <Paragraph>{event.description}</Paragraph>
                    </div>
                    <div style={{ marginTop: '40px' }}>
                        <Divider orientation="left">
                            <Title level={3}>{t('eventDetail.bookNow', 'Đặt vé ngay')}</Title>
                        </Divider>
                        {renderBookingSection()}
                    </div>
                </div>
            )}

            {!isMobile && (
                <div style={{ padding: 0 }}>
                    <Divider orientation="left"><Title level={3}>{t('eventDetail.eventIntro')}</Title></Divider>
                    <div style={{ fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                        <Paragraph>{event.description}</Paragraph>
                    </div>
                </div>
            )}
            <div style={{ padding: isMobile ? '0 24px' : 0, marginTop: '32px' }}>
                <Alert
                    message={t('eventDetail.bookingPolicyTitle')}
                    description={t('eventDetail.bookingPolicyDesc')}
                    type="info"
                    showIcon
                    style={{ borderRadius: '8px' }}
                />
            </div>

            {relatedEvents.length > 0 && (
                <div style={{ marginTop: '60px', paddingBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: isMobile ? '0 24px' : 0 }}>
                        <Title level={2} style={{ margin: 0 }}>
                            {t('eventDetail.youMightLike', 'Sự kiện có thể bạn sẽ thích')}
                        </Title>
                        <Button
                            type="text"
                            style={{ fontSize: '14px', color: '#1890ff', fontWeight: 500, padding: 0 }}
                            onClick={() => navigate('/events')}
                        >
                            {t('eventDetail.seeMore', 'Xem thêm')} <ArrowRightOutlined style={{ fontSize: '12px', marginLeft: '4px' }} />
                        </Button>
                    </div>
                    <div style={{ padding: isMobile ? '0 16px' : 0 }}>
                        <Row gutter={[isMobile ? 12 : 24, isMobile ? 12 : 24]}>
                            {relatedEvents.map(ev => (
                                <Col xs={24} sm={12} md={6} key={ev.id}>
                                    <FeaturedEventCard event={ev} />
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>
            )}

            <Modal
                title={<><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} /> Xác Nhận Thông Tin Đặt Vé</>}
                open={isConfirmVisible}
                onOk={handleConfirmBooking}
                onCancel={() => setIsConfirmVisible(false)}
                okText="Xác nhận & Tiếp tục"
                cancelText="Hủy"
                confirmLoading={bookingMutation.isPending}
                centered
            >
                <div style={{ padding: '10px 0' }}>
                    <Text>
                        Bạn đang đặt <strong>{quantity} vé {selectedTicket?.zoneName}</strong> với tổng số tiền <strong>{selectedTicket ? formatCurrency(selectedTicket.price * quantity) : '0 ₫'}</strong>.
                    </Text>
                    <br /><br />
                    <Alert
                        message="Lưu ý quan trọng"
                        description="Sau khi xác nhận đặt vé, bạn sẽ có đúng 15 phút để hoàn tất thanh toán. Quá thời gian này, hệ thống sẽ tự động hủy đơn hàng để nhường vé cho người khác."
                        type="warning"
                        showIcon
                    />
                </div>
            </Modal>

            <Modal
                title={<><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> {t('eventDetail.bookingSuccess', 'Đặt Vé Thành Công')}</>}
                open={isSuccessVisible}
                onOk={() => { setIsSuccessVisible(false); navigate('/history'); }}
                onCancel={() => { setIsSuccessVisible(false); navigate('/history'); }}
                okText={t('eventDetail.payNowBtn', 'Thanh toán ngay')}
                cancelButtonProps={{ style: { display: 'none' } }}
                centered
            >
                <div style={{ padding: '10px 0' }}>
                    <Text>{t('eventDetail.bookingSuccessContent', 'Đơn đặt vé của bạn đã được giữ chỗ! Vui lòng hoàn tất thanh toán ngay trong vòng 15 phút để tránh bị hệ thống hủy vé tự động nhé.')}</Text>
                </div>
            </Modal>

            <div className="mobile-sticky-bottom-bar" style={{
                position: 'fixed',
                bottom: '70px', left: 0, right: 0,
                background: isDark ? 'rgba(20, 20, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                borderTop: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.12)',
                zIndex: 1000,
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                opacity: isBookingInView ? 0 : 1,
                visibility: isBookingInView ? 'hidden' : 'visible',
                pointerEvents: isBookingInView ? 'none' : 'auto',
                transition: 'all 0.3s ease-in-out',
                transform: isBookingInView ? 'translateY(20px)' : 'translateY(0)'
            }}>
                <div>
                    <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '2px' }}>{t('common.from', 'Từ')}</Text>
                    <Text strong style={{ fontSize: '18px', color: '#f5222d' }}>
                        {event.ticketTypes?.length > 0 ? formatCurrency(Math.min(...event.ticketTypes.map(t => t.price))) : '0 ₫'}
                    </Text>
                </div>
                <Button type="primary" size="large" style={{ borderRadius: '8px', padding: '0 32px', fontWeight: 600 }} onClick={() => {
                    document.getElementById('booking-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}>
                    {t('common.buyNow', 'Mua vé ngay')}
                </Button>
            </div>
        </div>
    );
};

export default EventDetail;
