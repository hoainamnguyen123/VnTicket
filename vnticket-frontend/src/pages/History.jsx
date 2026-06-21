import React, { useState, useEffect, useContext } from 'react';
import { Table, Typography, Tag, Button, Modal, message, Skeleton, Card, Tabs, Input, Alert, Spin, Space } from 'antd';
import { ArrowRightOutlined, CalendarOutlined, ClockCircleOutlined, ExclamationCircleOutlined, SyncOutlined, WalletOutlined, CreditCardOutlined, EyeOutlined, CloseCircleOutlined, SwapOutlined, GiftOutlined, MailOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ElectronicTicketModal from '../components/ElectronicTicketModal';

const { Title, Text } = Typography;
/* ── Hook: theo dõi kích thước màn hình ── */
const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [breakpoint]);
    return isMobile;
};

/* ── Helper: Cờ kiểm tra vé đã quá hạn 15 phút chưa ── */
const isBookingExpired = (bookingTime) => {
    if (!bookingTime) return false;
    const bookingDate = new Date(bookingTime);
    const expiryDate = new Date(bookingDate.getTime() + 15 * 60000);
    return new Date() >= expiryDate;
};

/* ── Countdown Timer ── */
const CountdownTimer = ({ bookingTime, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const hasExpiredRef = React.useRef(false);
    const initiallyExpiredRef = React.useRef(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const bookingDate = new Date(bookingTime);
            const expiryDate = new Date(bookingDate.getTime() + 15 * 60000);
            const now = new Date();
            const diff = expiryDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('00:00');
                if (initiallyExpiredRef.current === null) {
                    initiallyExpiredRef.current = true; // Expired BEFORE mounting (do nothing)
                } else if (initiallyExpiredRef.current === false) {
                    if (!hasExpiredRef.current) {
                        hasExpiredRef.current = true;
                        onExpire(); // Only trigger if it actively expired DURING session
                    }
                }
                return true;
            } else {
                if (initiallyExpiredRef.current === null) {
                    initiallyExpiredRef.current = false;
                }
                const minutes = Math.floor((diff / 1000) / 60);
                const seconds = Math.floor((diff / 1000) % 60);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                return false;
            }
        };

        const isExpired = calculateTimeLeft();
        if (isExpired) return;

        const interval = setInterval(() => {
            const expired = calculateTimeLeft();
            if (expired) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [bookingTime, onExpire]);

    if (!timeLeft) return null;
    return (
        <Text type="danger" style={{ fontSize: '12px', fontWeight: 'bold' }}>
            ⏱ {timeLeft}
        </Text>
    );
};

/* ── Payment Method Card ── */
const PaymentMethodCard = ({ name, imgSrc, borderColor, bgColor, disabled, comingSoon, onClick, selected, comingSoonText, isDark }) => (
    <div
        onClick={disabled ? undefined : onClick}
        style={{
            border: `2px solid ${selected ? borderColor : (isDark ? '#434343' : '#e8e8e8')}`,
            borderRadius: '12px',
            padding: '20px 16px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            background: selected ? bgColor : (isDark ? '#141414' : '#fff'),
            transition: 'all 0.3s ease',
            position: 'relative',
            textAlign: 'center',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: selected ? `0 4px 12px ${borderColor}40` : (isDark ? '0 1px 4px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.08)'),
        }}
        onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.boxShadow = `0 4px 12px ${borderColor}40`; } }}
        onMouseLeave={(e) => { if (!disabled && !selected) { e.currentTarget.style.borderColor = isDark ? '#434343' : '#e8e8e8'; e.currentTarget.style.boxShadow = isDark ? '0 1px 4px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.08)'; } }}
    >
        {comingSoon && (
            <Tag color="default" style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px', margin: 0, background: isDark ? '#262626' : undefined, borderColor: isDark ? '#434343' : undefined, color: isDark ? '#e8e8e8' : undefined }}>
                {comingSoonText}
            </Tag>
        )}
        <img
            src={imgSrc}
            alt={name}
            style={{ width: '56px', height: '56px', objectFit: 'contain' }}
        />
        <Text strong style={{ fontSize: '14px', color: selected ? borderColor : (isDark ? '#e8e8e8' : '#333') }}>{name}</Text>
    </div>
);

/* ── Thẻ đơn vé dùng chung cho desktop và mobile ── */
const BookingCard = ({
    booking,
    onPay,
    onViewTickets,
    onCancel,
    onExpire,
    onTransfer,
    onOpenEvent,
    t,
    isMobile,
    isDark,
}) => {
    const statusColor = booking.status === 'PAID' ? 'green' : (booking.status === 'PENDING' ? 'gold' : 'red');
    const statusText = booking.status === 'PAID' ? t('history.paid') : (booking.status === 'PENDING' ? t('history.pending') : t('history.cancelled'));
    const canPay = booking.status === 'PENDING' && !isBookingExpired(booking.bookingTime);

    return (
        <Card
            hoverable
            styles={{ body: { padding: 0 } }}
            style={{
                borderRadius: 18,
                overflow: 'hidden',
                border: `1px solid ${isDark ? '#303030' : '#e8edf3'}`,
                boxShadow: isDark ? '0 10px 28px rgba(0,0,0,.22)' : '0 10px 28px rgba(31,54,88,.08)',
            }}
        >
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 230px',
                minHeight: isMobile ? 'auto' : 190,
                borderLeft: `5px solid ${
                    booking.status === 'PAID'
                        ? '#52c41a'
                        : booking.status === 'PENDING'
                            ? '#faad14'
                            : '#bfbfbf'
                }`,
            }}>
                <div style={{
                    padding: isMobile ? 16 : '22px 26px',
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 12,
                    }}>
                        <Space size={8} wrap>
                            <Tag color={statusColor} style={{ margin: 0 }}>{statusText}</Tag>
                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                                Đơn #{booking.id}
                            </Text>
                            {booking.status === 'PENDING' && (
                                <CountdownTimer bookingTime={booking.bookingTime} onExpire={onExpire} />
                            )}
                        </Space>
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpenEvent(booking.eventId)}
                        style={{
                            padding: 0,
                            border: 0,
                            background: 'transparent',
                            color: isDark ? '#f5f5f5' : '#172033',
                            textAlign: 'left',
                            cursor: 'pointer',
                            font: 'inherit',
                            marginBottom: 14,
                        }}
                    >
                        <Title level={4} ellipsis={{ rows: 2 }} style={{ margin: 0, lineHeight: 1.35 }}>
                            {booking.eventName}
                        </Title>
                        <Text style={{ color: '#1677ff', fontSize: 12, fontWeight: 600 }}>
                            Xem chi tiết sự kiện <ArrowRightOutlined />
                        </Text>
                    </button>

                    <Space orientation="vertical" size={7} style={{ width: '100%' }}>
                        {booking.eventStartTime && (
                            <Text type="secondary">
                                <CalendarOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                                {formatDate(booking.eventStartTime)}
                            </Text>
                        )}
                        <Text type="secondary">
                            <ClockCircleOutlined style={{ color: '#8c8c8c', marginRight: 8 }} />
                            {t('history.bookingDate')}: {formatDate(booking.bookingTime)}
                        </Text>
                    </Space>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 7,
                        marginTop: 14,
                    }}>
                        {booking.bookingDetails?.map((detail, index) => (
                            <Tag
                                key={`${detail.ticketTypeId || detail.zoneName}-${index}`}
                                color="blue"
                                style={{ margin: 0, padding: '3px 9px', borderRadius: 6 }}
                            >
                                {detail.zoneName} · {detail.quantity} vé
                            </Tag>
                        ))}
                    </div>
                </div>

                <div style={{
                    padding: isMobile ? 16 : 20,
                    borderLeft: isMobile ? 'none' : `1px solid ${isDark ? '#303030' : '#edf0f3'}`,
                    borderTop: isMobile ? `1px solid ${isDark ? '#303030' : '#edf0f3'}` : 'none',
                    background: isDark ? '#181818' : '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                }}>
                    <div>
                        <Text type="secondary" style={{ display: 'block', fontSize: 12, letterSpacing: .6 }}>
                            {t('history.totalAmount')}
                        </Text>
                        <Title level={3} style={{
                            margin: '3px 0 0',
                            color: booking.totalAmount === 0 ? '#52c41a' : '#cf1322',
                        }}>
                            {formatCurrency(booking.totalAmount)}
                        </Title>
                    </div>

                    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                        {booking.status === 'PAID' && (
                            <>
                                <Button
                                    type="primary"
                                    block
                                    icon={<EyeOutlined />}
                                    onClick={() => onViewTickets(booking.id)}
                                >
                                    {t('history.viewTickets')}
                                </Button>
                                <Button
                                    block
                                    icon={<GiftOutlined />}
                                    onClick={() => onTransfer(booking.id)}
                                    style={{ borderColor: '#722ed1', color: '#722ed1' }}
                                >
                                    {t('eTicket.transferBtn')}
                                </Button>
                            </>
                        )}
                        {booking.status === 'PENDING' && (
                            <>
                            {canPay ? (
                            <Button
                                type="primary"
                                block
                                icon={<WalletOutlined />}
                                style={{ background: 'linear-gradient(135deg, #1890ff, #722ed1)', borderColor: 'transparent' }}
                                onClick={() => onPay(booking)}
                            >
                                {booking.totalAmount === 0 ? t('history.getFreeTicket', 'Nhận vé miễn phí') : t('history.pay')}
                            </Button>
                            ) : (
                                <Tag color="error" style={{ margin: 0, padding: '5px 10px', textAlign: 'center' }}>
                                    Đã quá hạn thanh toán
                                </Tag>
                            )}
                            <Button
                                danger
                                block
                                icon={<CloseCircleOutlined />}
                                onClick={() => onCancel(booking.id)}
                            >
                                {t('history.cancelTicket')}
                            </Button>
                            </>
                        )}
                        {booking.status === 'CANCELLED' && (
                            <Button block onClick={() => onOpenEvent(booking.eventId)}>
                                Xem lại sự kiện
                            </Button>
                        )}
                    </Space>
                </div>
            </div>
        </Card>
    );
};

/* ── Main Component ── */
const History = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState([]);
    const [transferHistory, setTransferHistory] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [viewedBookingId, setViewedBookingId] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [guideModalVisible, setGuideModalVisible] = useState(false);

    // Transfer flow state
    const [transferPickerVisible, setTransferPickerVisible] = useState(false);
    const [transferableTickets, setTransferableTickets] = useState([]);
    const [transferEmailVisible, setTransferEmailVisible] = useState(false);
    const [transferTargetTicket, setTransferTargetTicket] = useState(null);
    const [transferEmail, setTransferEmail] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const { user, loading: authLoading } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTabKey = searchParams.get('tab') || 'PENDING';
    const [modal, contextHolder] = Modal.useModal();

    const onTabChange = (key) => {
        setSearchParams({ tab: key });
    };

    const fetchBookings = React.useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await axiosClient.get('/bookings/my');
            setBookings(response.data);
        } catch (error) {
            console.error('Fetch bookings error:', error);
            if (!silent) message.error(t('history.loadError'));
        } finally {
            if (!silent) setLoading(false);
        }
    }, [t]);

    const fetchTransferHistory = React.useCallback(async () => {
        try {
            const response = await axiosClient.get('/tickets/transfer/history');
            setTransferHistory(response.data);
        } catch (error) {
            console.error('Fetch transfer history error:', error);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/login');
        } else {
            fetchBookings();
            fetchTransferHistory();
        }
    }, [user, navigate, authLoading, fetchBookings, fetchTransferHistory]);

    const handleCancel = (bookingId) => {
        modal.confirm({
            title: t('history.confirmCancel'),
            icon: <ExclamationCircleOutlined />,
            content: t('history.confirmCancelContent'),
            okText: t('common.confirm'),
            okType: 'danger',
            cancelText: t('common.cancel'),
            onOk: async () => {
                try {
                    await axiosClient.put(`/bookings/${bookingId}/cancel`);
                    message.success(t('history.cancelSuccess'));
                    await fetchBookings();
                } catch (error) {
                    message.error(error.message || t('history.cancelFailed'));
                }
            },
        });
    };

    const handleViewTickets = async (bookingId) => {
        try {
            const response = await axiosClient.get(`/bookings/${bookingId}/tickets`);
            setTickets(response.data);
            setViewedBookingId(bookingId);
            setIsModalVisible(true);
        } catch {
            message.error(t('history.loadTicketsError'));
        }
    };

    const handleTicketTransferred = async () => {
        // Refresh ticket list in modal
        if (viewedBookingId) {
            try {
                const response = await axiosClient.get(`/bookings/${viewedBookingId}/tickets`);
                setTickets(response.data);
            } catch (error) {
                console.error('Refresh tickets error:', error);
            }
        }
        // Also refresh bookings list and transfer history
        fetchBookings(true);
        fetchTransferHistory();
    };

    // ── Transfer flow handlers ──
    const handleOpenTransfer = async (bookingId) => {
        try {
            const response = await axiosClient.get(`/bookings/${bookingId}/tickets`);
            const validTickets = response.data.filter(t => t.status === 'VALID');
            if (validTickets.length === 0) {
                message.info(t('ticketTransfer.noValidToTransfer', 'Không có vé hợp lệ để tặng'));
                return;
            }
            if (validTickets.length === 1) {
                // Chỉ 1 vé → đi thẳng nhập email
                setTransferTargetTicket(validTickets[0]);
                setTransferEmail('');
                setTransferEmailVisible(true);
            } else {
                // Nhiều vé → chọn vé
                setTransferableTickets(validTickets);
                setTransferPickerVisible(true);
            }
        } catch {
            message.error(t('history.loadTicketsError'));
        }
    };

    const handlePickTicket = (ticket) => {
        setTransferTargetTicket(ticket);
        setTransferEmail('');
        setTransferPickerVisible(false);
        setTransferEmailVisible(true);
    };

    const handleConfirmTransfer = async () => {
        if (!transferEmail || !transferEmail.includes('@')) {
            message.warning(t('ticketTransfer.recipientEmailRequired'));
            return;
        }

        modal.confirm({
            title: t('ticketTransfer.confirmTransferTitle'),
            content: (
                <div dangerouslySetInnerHTML={{ 
                    __html: t('ticketTransfer.confirmTransferMessage', { email: transferEmail }) 
                }} />
            ),
            okText: t('common.confirm'),
            cancelText: t('common.cancel'),
            centered: true,
            onOk: async () => {
                setTransferLoading(true);
                try {
                    await axiosClient.post('/tickets/transfer', {
                        ticketId: transferTargetTicket.id,
                        recipientEmail: transferEmail,
                    });
                    message.success(t('ticketTransfer.transferSuccessDetail', { email: transferEmail }));
                    setTransferEmailVisible(false);
                    setTransferTargetTicket(null);
                    await fetchBookings(true);
                    await fetchTransferHistory();
                } catch (error) {
                    message.error(error.message || t('ticketTransfer.transferError'));
                } finally {
                    setTransferLoading(false);
                }
            }
        });
    };

    const handleFreeCheckout = async (bookingId) => {
        setPaymentLoading(true);
        try {
            await axiosClient.post(`/payment/free-checkout?bookingId=${bookingId}`);
            message.success(t('history.freeCheckoutSuccess', 'Nhận vé miễn phí thành công!'));
            await fetchBookings(true);
        } catch (error) {
            message.error(error.message || t('history.freeCheckoutError', 'Có lỗi xảy ra khi nhận vé'));
        } finally {
            setPaymentLoading(false);
        }
    };

    const openPaymentModal = (booking) => {
        if (booking.totalAmount === 0) {
            handleFreeCheckout(booking.id);
            return;
        }
        setSelectedBookingId(booking.id);
        setSelectedMethod(null);
        setPaymentModalVisible(true);
    };

    const handleConfirmPayment = async () => {
        if (selectedMethod === 'vnpay') {
            setPaymentLoading(true);
            try {
                const response = await axiosClient.get(`/payment/create?bookingId=${selectedBookingId}`);
                const paymentUrl = response.data;
                window.location.href = paymentUrl;
            } catch (error) {
                message.error(error.message || t('history.paymentLinkError'));
            } finally {
                setPaymentLoading(false);
            }
        }
    };

    if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

    const pendingBookings = bookings.filter(b => b.status === 'PENDING');
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
    const paidBookings = bookings.filter(b => b.status === 'PAID');
    
    // Sort logic
    const upcomingPaidBookings = paidBookings.filter(b => !b.eventStartTime || new Date(b.eventStartTime) >= new Date());
    const pastPaidBookings = paidBookings.filter(b => b.eventStartTime && new Date(b.eventStartTime) < new Date());

    const renderBookingsList = (bookingList) => {
        return (
            <div style={{ paddingTop: 14 }}>
                {bookingList.length === 0 ? (
                    <Card style={{ textAlign: 'center', padding: '40px', borderRadius: 16 }}>
                        <Text type="secondary">{t('history.noBookings')}</Text>
                    </Card>
                ) : (
                    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                        {bookingList.map(booking => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onPay={openPaymentModal}
                                onViewTickets={handleViewTickets}
                                onCancel={handleCancel}
                                onTransfer={handleOpenTransfer}
                                onOpenEvent={(eventId) => navigate(`/event/${eventId}`)}
                                onExpire={() => fetchBookings(true)}
                                t={t}
                                isMobile={isMobile}
                                isDark={isDark}
                            />
                        ))}
                    </Space>
                )}
            </div>
        );
    };

    const paidItems = [
        {
            label: `${t('history.upcomingEvents', 'Sự kiện chưa diễn ra')} (${upcomingPaidBookings.length})`,
            key: 'UPCOMING',
            children: renderBookingsList(upcomingPaidBookings)
        },
        {
            label: `${t('history.pastEvents', 'Sự kiện đã diễn ra')} (${pastPaidBookings.length})`,
            key: 'PAST',
            children: renderBookingsList(pastPaidBookings)
        }
    ];

    const tabItems = [
        {
            label: `${t('history.pending', 'Chờ thanh toán')} (${pendingBookings.length})`,
            key: 'PENDING',
            children: renderBookingsList(pendingBookings)
        },
        {
            label: `${t('history.paid', 'Đã thanh toán')} (${paidBookings.length})`,
            key: 'PAID',
            children: (
                <div style={{ backgroundColor: isDark ? '#141414' : '#fafafa', padding: '16px', borderRadius: '8px', border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}` }}>
                    <Tabs type="card" items={paidItems} defaultActiveKey="UPCOMING" />
                </div>
            )
        },
        {
            label: `${t('history.cancelled', 'Đã hủy')} (${cancelledBookings.length})`,
            key: 'CANCELLED',
            children: renderBookingsList(cancelledBookings)
        },
        {
            label: (
                <span>
                    <SwapOutlined style={{ marginRight: 6 }} />
                    {`${t('ticketTransfer.historyTitle', 'Lịch sử chuyển vé')} (${transferHistory.length})`}
                </span>
            ),
            key: 'TRANSFER',
            children: (
                <div style={{ paddingTop: 12 }}>
                    {transferHistory.length === 0 ? (
                        <Card style={{ textAlign: 'center', padding: '40px' }}>
                            <Text type="secondary">{t('ticketTransfer.noHistory', 'Chưa có lịch sử chuyển vé')}</Text>
                        </Card>
                    ) : (
                        isMobile ? (
                            transferHistory.map((item) => {
                                const isSent = item.fromEmail === user?.email || item.fromUsername === user?.username;
                                return (
                                    <Card
                                        key={item.id}
                                        size="small"
                                        style={{
                                            marginBottom: '12px',
                                            borderRadius: '12px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                            borderLeft: `4px solid ${isSent ? '#ff4d4f' : '#52c41a'}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <Text strong style={{ color: '#1890ff' }}>{item.eventName}</Text>
                                            <Tag color={isSent ? 'red' : 'green'}>
                                                {isSent ? t('ticketTransfer.sent') : t('ticketTransfer.received')}
                                            </Tag>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                                            <Text><strong>{t('ticketTransfer.zone')}:</strong> {item.zoneName}</Text>
                                            <Text>
                                                <strong>{isSent ? t('ticketTransfer.to') : t('ticketTransfer.from')}:</strong>{' '}
                                                {isSent ? item.toEmail : item.fromEmail}
                                            </Text>
                                            <Text type="secondary">📅 {formatDate(item.transferredAt)}</Text>
                                        </div>
                                    </Card>
                                );
                            })
                        ) : (
                            <Table
                                dataSource={transferHistory}
                                rowKey="id"
                                pagination={{ pageSize: 10 }}
                                columns={[
                                    {
                                        title: t('ticketTransfer.event'),
                                        dataIndex: 'eventName',
                                        key: 'eventName',
                                        render: text => <strong style={{ color: '#1890ff' }}>{text}</strong>
                                    },
                                    {
                                        title: t('ticketTransfer.zone'),
                                        dataIndex: 'zoneName',
                                        key: 'zoneName',
                                        width: 120,
                                        render: z => <Tag color="blue">{z}</Tag>
                                    },
                                    {
                                        title: t('ticketTransfer.from'),
                                        dataIndex: 'fromEmail',
                                        key: 'fromEmail',
                                        render: (email, record) => {
                                            const isMe = email === user?.email || record.fromUsername === user?.username;
                                            return <Text>{isMe ? <Tag color="default">{t('ticketTransfer.you', 'Bạn')}</Tag> : email}</Text>;
                                        }
                                    },
                                    {
                                        title: t('ticketTransfer.to'),
                                        dataIndex: 'toEmail',
                                        key: 'toEmail',
                                        render: (email, record) => {
                                            const isMe = email === user?.email || record.toUsername === user?.username;
                                            return <Text>{isMe ? <Tag color="default">{t('ticketTransfer.you', 'Bạn')}</Tag> : email}</Text>;
                                        }
                                    },
                                    {
                                        title: t('ticketTransfer.time'),
                                        dataIndex: 'transferredAt',
                                        key: 'transferredAt',
                                        width: 160,
                                        render: time => formatDate(time)
                                    },
                                    {
                                        title: '',
                                        key: 'direction',
                                        width: 100,
                                        render: (_, record) => {
                                            const isSent = record.fromEmail === user?.email || record.fromUsername === user?.username;
                                            return <Tag color={isSent ? 'red' : 'green'}>{isSent ? t('ticketTransfer.sent') : t('ticketTransfer.received')}</Tag>;
                                        }
                                    }
                                ]}
                            />
                        )
                    )}
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: isMobile ? '0 16px' : 0 }}>
            <Spin fullscreen spinning={paymentLoading || transferLoading} size="large" tip="Đang xử lý giao dịch..." />
            {contextHolder}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={isMobile ? 4 : 2} style={{ margin: 0 }}>{t('history.title')}</Title>
                <Button icon={<SyncOutlined />} onClick={fetchBookings} size={isMobile ? 'small' : 'middle'}>
                    {t('history.refresh')}
                </Button>
            </div>

            <Tabs activeKey={activeTabKey} onChange={onTabChange} items={tabItems} size="large" />

            <ElectronicTicketModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                tickets={tickets}
                onTicketTransferred={handleTicketTransferred}
            />

            {/* ── Modal chọn phương thức thanh toán ── */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CreditCardOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600 }}>{t('history.selectPaymentMethod')}</span>
                    </div>
                }
                open={paymentModalVisible}
                onCancel={() => { setPaymentModalVisible(false); setSelectedMethod(null); }}
                footer={[
                    <Button key="cancel" onClick={() => { setPaymentModalVisible(false); setSelectedMethod(null); }}>
                        {t('common.cancel')}
                    </Button>,
                    <Button
                        key="confirm"
                        type="primary"
                        disabled={!selectedMethod}
                        loading={paymentLoading}
                        onClick={handleConfirmPayment}
                        style={{
                            background: selectedMethod ? 'linear-gradient(135deg, #1890ff, #722ed1)' : undefined,
                            borderColor: selectedMethod ? 'transparent' : undefined,
                        }}
                    >
                        {t('history.confirmPayment')}
                    </Button>
                ]}
                width={isMobile ? '95%' : 520}
                centered
            >
                <div style={{ padding: '12px 0' }}>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                            type="link" 
                            icon={<ExclamationCircleOutlined />} 
                            onClick={() => setGuideModalVisible(true)}
                            style={{ padding: 0, height: 'auto', fontSize: '13px' }}
                        >
                            Hướng dẫn thanh toán TEST
                        </Button>
                    </div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                        {t('history.selectPaymentHint')}
                    </Text>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <PaymentMethodCard
                            name="ATM / Internet Banking / QR"
                            imgSrc="/images/vnpay-logo.png"
                            bgColor={isDark ? 'rgba(0, 96, 175, 0.2)' : '#e6f4ff'}
                            borderColor={isDark ? '#4096ff' : '#0060af'}
                            selected={selectedMethod === 'vnpay'}
                            onClick={() => setSelectedMethod('vnpay')}
                            isDark={isDark}
                        />
                        <PaymentMethodCard
                            name="MoMo"
                            imgSrc="/images/momo-logo.png"
                            bgColor={isDark ? 'rgba(174, 32, 112, 0.2)' : '#fff0f6'}
                            borderColor={isDark ? '#ff69b4' : '#ae2070'}
                            disabled
                            comingSoon
                            comingSoonText={t('history.comingSoon')}
                            isDark={isDark}
                        />
                        <PaymentMethodCard
                            name="ZaloPay"
                            imgSrc="/images/zalopay-logo.png"
                            bgColor={isDark ? 'rgba(0, 143, 229, 0.2)' : '#e6f7ff'}
                            borderColor={isDark ? '#4096ff' : '#008fe5'}
                            disabled
                            comingSoon
                            comingSoonText={t('history.comingSoon')}
                            isDark={isDark}
                        />
                    </div>
                </div>
            </Modal>

            {/* ── Modal chọn vé để tặng (khi có nhiều vé) ── */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <GiftOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600 }}>{t('ticketTransfer.pickTicket', 'Chọn vé muốn tặng')}</span>
                    </div>
                }
                open={transferPickerVisible}
                onCancel={() => setTransferPickerVisible(false)}
                footer={null}
                width={460}
                centered
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0' }}>
                    {transferableTickets.map(ticket => (
                        <Card
                            key={ticket.id}
                            hoverable
                            size="small"
                            onClick={() => handlePickTicket(ticket)}
                            style={{
                                borderRadius: '10px',
                                border: '1px solid #d3adf7',
                                cursor: 'pointer',
                            }}
                            bodyStyle={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div>
                                <Text strong style={{ color: '#1890ff' }}>{ticket.eventName}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {t('ticketTransfer.zone')}: <Tag color="blue">{ticket.zoneName}</Tag>
                                    {t('ticketTransfer.ticketCode')}: <code>{ticket.ticketCode}</code>
                                </Text>
                            </div>
                            <GiftOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
                        </Card>
                    ))}
                </div>
            </Modal>

            {/* ── Modal nhập email người nhận ── */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <GiftOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600 }}>{t('ticketTransfer.modalTitle')}</span>
                    </div>
                }
                open={transferEmailVisible}
                onCancel={() => { setTransferEmailVisible(false); setTransferTargetTicket(null); }}
                footer={[
                    <Button key="cancel" onClick={() => { setTransferEmailVisible(false); setTransferTargetTicket(null); }}>
                        {t('common.cancel')}
                    </Button>,
                    <Button
                        key="confirm"
                        type="primary"
                        loading={transferLoading}
                        disabled={!transferEmail}
                        onClick={handleConfirmTransfer}
                        style={{
                            background: transferEmail ? 'linear-gradient(135deg, #722ed1, #9254de)' : undefined,
                            borderColor: transferEmail ? 'transparent' : undefined,
                        }}
                    >
                        {t('ticketTransfer.confirmTransfer')}
                    </Button>
                ]}
                width={460}
                centered
            >
                {transferTargetTicket && (
                    <div style={{ padding: '8px 0' }}>
                        <div style={{
                            background: isDark ? '#262626' : '#f6f0ff',
                            borderRadius: '10px',
                            padding: '16px',
                            marginBottom: '16px',
                            border: `1px solid ${isDark ? '#434343' : '#d3adf7'}`
                        }}>
                            <Text strong style={{ display: 'block', marginBottom: '4px', color: '#722ed1' }}>
                                {t('ticketTransfer.ticketInfo')}
                            </Text>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                                <Text><strong>{t('ticketTransfer.event')}:</strong> {transferTargetTicket.eventName}</Text>
                                <Text><strong>{t('ticketTransfer.zone')}:</strong> {transferTargetTicket.zoneName}</Text>
                                <Text><strong>{t('ticketTransfer.ticketCode')}:</strong> <code>{transferTargetTicket.ticketCode}</code></Text>
                            </div>
                        </div>

                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                            {t('ticketTransfer.recipientEmail')}
                        </Text>
                        <Input
                            prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder={t('ticketTransfer.recipientEmailPlaceholder')}
                            value={transferEmail}
                            onChange={(e) => setTransferEmail(e.target.value)}
                            size="large"
                            style={{ borderRadius: '8px', marginBottom: '16px' }}
                        />

                        <Alert
                            type="warning"
                            showIcon
                            message={t('ticketTransfer.warning')}
                            style={{ borderRadius: '8px' }}
                        />
                    </div>
                )}
            </Modal>
            {/* ── Modal Hướng dẫn thanh toán TEST ── */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CreditCardOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600 }}>Hướng dẫn thanh toán TEST (VNPAY)</span>
                    </div>
                }
                open={guideModalVisible}
                onCancel={() => setGuideModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setGuideModalVisible(false)}>
                        Đã hiểu
                    </Button>
                ]}
                width={isMobile ? '95%' : 480}
                centered
            >
                <div style={{ padding: '12px 0' }}>
                    <Alert
                        message={<Text strong style={{ color: '#1890ff' }}>💳 Thông tin thẻ dùng để test thanh toán</Text>}
                        description={
                            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    Tại trang thanh toán của VNPAY, hãy chọn:<br />
                                    1. <strong>Thẻ nội địa và tài khoản ngân hàng</strong><br />
                                    2. Ngân hàng: <strong>NCB</strong>
                                </div>
                                <div style={{ background: isDark ? '#1f1f1f' : '#f0f7ff', padding: '16px', borderRadius: '12px', border: `1px dashed ${isDark ? '#434343' : '#91caff'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <Text>Số thẻ: <strong style={{ letterSpacing: '1px', fontSize: '15px' }}>9704198526191432198</strong></Text>
                                        <Button 
                                            size="small" 
                                            type="primary" 
                                            ghost 
                                            onClick={() => {
                                                navigator.clipboard.writeText('9704198526191432198');
                                                message.success('Đã sao chép số thẻ test!');
                                            }}
                                        >
                                            Sao chép
                                        </Button>
                                    </div>
                                    <Text style={{ display: 'block', marginBottom: '4px' }}>Tên chủ thẻ: <strong>NGUYEN VAN A</strong></Text>
                                    <Text style={{ display: 'block', marginBottom: '4px' }}>Ngày phát hành: <strong>07/15</strong></Text>
                                    <Text style={{ display: 'block' }}>Mật khẩu OTP: <strong>123456</strong></Text>
                                </div>
                            </div>
                        }
                        type="info"
                        showIcon={false}
                        style={{ borderRadius: '12px', border: '1px solid #91caff' }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default History;
