import React, { useState, useEffect, useContext } from 'react';
import { Table, Typography, Tag, Button, Modal, message, Skeleton, Card, Tabs, Input, Alert } from 'antd';
import { ExclamationCircleOutlined, SyncOutlined, WalletOutlined, CreditCardOutlined, EyeOutlined, CloseCircleOutlined, SwapOutlined, GiftOutlined, MailOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ElectronicTicketModal from '../components/ElectronicTicketModal';

const { Title, Text } = Typography;
const { confirm } = Modal;

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

/* ── Countdown Timer ── */
const CountdownTimer = ({ bookingTime, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const bookingDate = new Date(bookingTime);
            const expiryDate = new Date(bookingDate.getTime() + 15 * 60000);
            const now = new Date();
            const diff = expiryDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('00:00');
                return true;
            } else {
                const minutes = Math.floor((diff / 1000) / 60);
                const seconds = Math.floor((diff / 1000) % 60);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                return false;
            }
        };

        const isExpired = calculateTimeLeft();
        if (isExpired) {
            onExpire();
            return;
        }

        const interval = setInterval(() => {
            const expired = calculateTimeLeft();
            if (expired) {
                clearInterval(interval);
                onExpire();
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

/* ── Booking Card cho Mobile ── */
const BookingCard = ({ booking, onPay, onViewTickets, onCancel, onExpire, onTransfer, t }) => {
    const statusColor = booking.status === 'PAID' ? 'green' : (booking.status === 'PENDING' ? 'gold' : 'red');
    const statusText = booking.status === 'PAID' ? t('history.paid') : (booking.status === 'PENDING' ? t('history.pending') : t('history.cancelled'));

    return (
        <Card
            size="small"
            style={{
                marginBottom: '12px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: booking.status === 'PENDING' ? '1px solid #faad14' : (booking.status === 'PAID' ? '1px solid #52c41a' : '1px solid #f0f0f0'),
            }}
        >
            {/* Header: Mã đơn + Trạng thái */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Text strong style={{ fontSize: '14px' }}>#{booking.id}</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag color={statusColor} style={{ margin: 0 }}>{statusText}</Tag>
                    {booking.status === 'PENDING' && (
                        <CountdownTimer bookingTime={booking.bookingTime} onExpire={onExpire} />
                    )}
                </div>
            </div>

            {/* Tên sự kiện */}
            <Text strong style={{ color: '#1890ff', fontSize: '15px', display: 'block', marginBottom: '6px' }}>
                {booking.eventName}
            </Text>

            {/* Ngày đặt */}
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                📅 {formatDate(booking.bookingTime)}
            </Text>

            {/* Chi tiết vé */}
            <div style={{ marginBottom: '8px' }}>
                {booking.bookingDetails?.map((d, index) => (
                    <span key={index} style={{ marginRight: '6px' }}>
                        <Tag color="blue" style={{ margin: '2px 0' }}>{d.zoneName}</Tag>
                        <Text style={{ fontSize: '12px' }}>x{d.quantity}</Text>
                    </span>
                ))}
            </div>

            {/* Tổng tiền */}
            <Text type="danger" strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                {formatCurrency(booking.totalAmount)}
            </Text>

            {/* Nút hành động */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {booking.status === 'PAID' && (
                    <>
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onViewTickets(booking.id)}
                    >
                        {t('history.viewTickets')}
                    </Button>
                    <Button
                        size="small"
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
                        <Button
                            type="primary"
                            size="small"
                            icon={<WalletOutlined />}
                            style={{ background: 'linear-gradient(135deg, #1890ff, #722ed1)', borderColor: 'transparent' }}
                            onClick={() => onPay(booking.id)}
                        >
                            {t('history.pay')}
                        </Button>
                        <Button
                            danger
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={() => onCancel(booking.id)}
                        >
                            {t('history.cancelTicket')}
                        </Button>
                    </>
                )}
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
                    fetchBookings();
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
        } catch (error) {
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
        } catch (error) {
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
        setTransferLoading(true);
        try {
            await axiosClient.post('/tickets/transfer', {
                ticketId: transferTargetTicket.id,
                recipientEmail: transferEmail,
            });
            message.success(t('ticketTransfer.transferSuccessDetail', { email: transferEmail }));
            setTransferEmailVisible(false);
            setTransferTargetTicket(null);
            fetchBookings(true);
            fetchTransferHistory();
        } catch (error) {
            message.error(error.message || t('ticketTransfer.transferError'));
        } finally {
            setTransferLoading(false);
        }
    };

    const openPaymentModal = (bookingId) => {
        setSelectedBookingId(bookingId);
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

    /* ── Columns cho Table (Desktop) ── */
    const columns = [
        {
            title: t('history.orderId'),
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: id => <strong>#{id}</strong>
        },
        {
            title: t('history.event'),
            dataIndex: 'eventName',
            key: 'eventName',
            render: text => <strong style={{ color: '#1890ff' }}>{text}</strong>
        },
        {
            title: t('history.bookingDate'),
            dataIndex: 'bookingTime',
            key: 'bookingTime',
            width: 160,
            render: time => formatDate(time)
        },
        {
            title: t('history.ticketDetails'),
            dataIndex: 'bookingDetails',
            key: 'details',
            render: details => (
                <div>
                    {details.map((d, index) => (
                        <div key={index}>
                            <Tag color="blue">{d.zoneName}</Tag> x {d.quantity} {t('common.tickets')}
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: t('history.totalAmount'),
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 130,
            render: amount => <Text type="danger" strong>{formatCurrency(amount)}</Text>
        },
        {
            title: t('history.status'),
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status, record) => {
                let color = status === 'PAID' ? 'green' : (status === 'PENDING' ? 'gold' : 'red');
                let text = status === 'PAID' ? t('history.paid') : (status === 'PENDING' ? t('history.pending') : t('history.cancelled'));
                return (
                    <div>
                        <Tag color={color}>{text}</Tag>
                        {status === 'PENDING' && (
                            <CountdownTimer bookingTime={record.bookingTime} onExpire={() => fetchBookings()} />
                        )}
                    </div>
                );
            }
        },
        {
            title: t('history.actions'),
            key: 'action',
            width: 220,
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {record.status === 'PAID' && (
                        <>
                            <Button type="primary" ghost onClick={() => handleViewTickets(record.id)}>
                                {t('history.viewTickets')}
                            </Button>
                            <Button
                                icon={<GiftOutlined />}
                                onClick={() => handleOpenTransfer(record.id)}
                                style={{ borderColor: '#722ed1', color: '#722ed1' }}
                            >
                                {t('eTicket.transferBtn')}
                            </Button>
                        </>
                    )}
                    {record.status === 'PENDING' && (
                        <Button
                            type="primary"
                            icon={<WalletOutlined />}
                            style={{ background: 'linear-gradient(135deg, #1890ff, #722ed1)', borderColor: 'transparent' }}
                            onClick={() => openPaymentModal(record.id)}
                        >
                            {t('history.pay')}
                        </Button>
                    )}
                    <Button
                        type="link"
                        danger
                        disabled={record.status !== 'PENDING'}
                        onClick={() => handleCancel(record.id)}
                    >
                        {t('history.cancelTicket')}
                    </Button>
                </div>
            ),
        }
    ];

    if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

    const pendingBookings = bookings.filter(b => b.status === 'PENDING');
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
    const paidBookings = bookings.filter(b => b.status === 'PAID');
    
    // Sort logic
    const upcomingPaidBookings = paidBookings.filter(b => !b.eventStartTime || new Date(b.eventStartTime) >= new Date());
    const pastPaidBookings = paidBookings.filter(b => b.eventStartTime && new Date(b.eventStartTime) < new Date());

    const renderBookingsList = (bookingList) => {
        if (isMobile) {
            return (
                <div style={{ paddingTop: 12 }}>
                    {bookingList.length === 0 ? (
                        <Card style={{ textAlign: 'center', padding: '40px' }}>
                            <Text type="secondary">{t('history.noBookings')}</Text>
                        </Card>
                    ) : (
                        bookingList.map(booking => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onPay={openPaymentModal}
                                onViewTickets={handleViewTickets}
                                onCancel={handleCancel}
                                onTransfer={handleOpenTransfer}
                                onExpire={() => fetchBookings()}
                                t={t}
                            />
                        ))
                    )}
                </div>
            );
        }

        return (
            <Table
                style={{ paddingTop: 12 }}
                columns={columns}
                dataSource={bookingList}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 900 }}
                locale={{ emptyText: t('history.noBookings') }}
            />
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
        <div>
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
                    <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                        {t('history.selectPaymentHint')}
                    </Text>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <PaymentMethodCard
                            name="VNPay"
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
        </div>
    );
};

export default History;
