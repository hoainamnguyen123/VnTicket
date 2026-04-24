import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Layout, Row, Col, Card, Statistic, Table, Button, Space, 
    Typography, Tag, Divider, Empty, Spin, message, Grid 
} from 'antd';
import { 
    ArrowLeftOutlined, 
    DollarCircleOutlined, 
    ShoppingCartOutlined, 
    CheckCircleOutlined, 
    SyncOutlined,
    UserOutlined,
    CalendarOutlined,
    TrophyOutlined
} from '@ant-design/icons';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell 
} from 'recharts';
import axiosClient from '../api/axiosClient';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const EventStats = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [eventDetail, setEventDetail] = useState(null);

    // Determine if we are in admin mode or user mode based on URL
    const isAdmin = location.pathname.startsWith('/admin');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const statsUrl = isAdmin ? `/bookings/statistics/event/${id}` : `/bookings/statistics/my-event/${id}`;
            const ordersUrl = isAdmin ? `/bookings/event/${id}/paid` : `/bookings/my-event/${id}/paid`;
            
            const [statsRes, ordersRes, eventRes] = await Promise.all([
                axiosClient.get(statsUrl),
                axiosClient.get(ordersUrl),
                axiosClient.get(`/events/${id}`)
            ]);

            setStats(statsRes.data);
            // Lọc bỏ các đơn hàng 0đ (vé tặng) khỏi danh sách
            const paidOrders = (ordersRes.data || []).filter(o => o.totalAmount > 0);
            setOrders(paidOrders);
            setEventDetail(eventRes.data);
        } catch (error) {
            console.error("Error fetching event stats:", error);
            message.error(t('admin.loadStatsError'));
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
    };

    const columns = [
        {
            title: 'Mã Đơn',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <Text copyable fontStyle="italic">#{text}</Text>,
            width: 100,
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong><UserOutlined /> {record.username}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.phone || 'N/A'}</Text>
                </Space>
            ),
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'bookingTime',
            key: 'bookingTime',
            render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
            responsive: ['lg'],
        },
        {
            title: 'Chi tiết vé',
            key: 'details',
            render: (_, record) => (
                <div style={{ fontSize: '12px' }}>
                    {record.bookingDetails?.map((d, idx) => (
                        <div key={idx}>
                            <Tag color="blue">{d.zoneName}</Tag> x{d.quantity}
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (val) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(val)}</Text>,
            align: 'right',
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Spin size="large" tip="Đang tải dữ liệu thống kê..." />
            </div>
        );
    }

    if (!stats || !eventDetail) {
        return <Empty description="Không tìm thấy dữ liệu" />;
    }

    // Data for charts
    const pieData = [
        { name: 'Đã thanh toán', value: stats.paidBookings, color: '#52c41a' },
        { name: 'Chờ xử lý', value: stats.pendingBookings, color: '#faad14' },
        { name: 'Đã hủy', value: stats.cancelledBookings, color: '#ff4d4f' },
    ];

    return (
        <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header section */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <Space direction="vertical" size={0}>
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate(-1)}
                        style={{ marginBottom: 8 }}
                    >
                        Quay lại
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>
                        Thống kê: {eventDetail.name}
                    </Title>
                    <Space split={<Divider type="vertical" />}>
                        <Text type="secondary"><CalendarOutlined /> {dayjs(eventDetail.startTime).format('DD/MM/YYYY HH:mm')}</Text>
                        <Tag color="cyan">{eventDetail.type}</Tag>
                    </Space>
                </Space>
                
                <Card size="small" className="header-event-badge" style={{ 
                    borderRadius: '12px', 
                    background: isDark ? '#1d1d1d' : '#e6f7ff',
                    border: 'none',
                    minWidth: '200px'
                }}>
                    <Space direction="vertical" size={0}>
                        <Text type="secondary" size="small">Ban tổ chức</Text>
                        <Text strong>{eventDetail.organizerName || 'N/A'}</Text>
                    </Space>
                </Card>
            </div>

            {/* Stats Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderRadius: '12px', borderLeft: '4px solid #52c41a' }}>
                        <Statistic 
                            title="Tổng doanh thu" 
                            value={stats.totalRevenue} 
                            formatter={(val) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{formatCurrency(val)}</span>}
                            prefix={<DollarCircleOutlined />} 
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                            Thực nhận (sau phí 2%): <Text strong>{formatCurrency(stats.totalRevenue * 0.98)}</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderRadius: '12px', borderLeft: '4px solid #1890ff' }}>
                        <Statistic 
                            title="Vé đã bán thành công" 
                            value={stats.totalTicketsPaid} 
                            suffix={`/ ${stats.totalTicketsBooked}`}
                            prefix={<TrophyOutlined style={{ color: '#1890ff' }} />} 
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>Tỉ lệ thanh toán: {Math.round((stats.totalTicketsPaid / (stats.totalTicketsBooked || 1)) * 100)}%</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderRadius: '12px', borderLeft: '4px solid #faad14' }}>
                        <Statistic 
                            title="Số đơn đặt hàng" 
                            value={stats.totalBookings} 
                            prefix={<ShoppingCartOutlined style={{ color: '#faad14' }} />} 
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{stats.pendingBookings} đơn đang chờ</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderRadius: '12px', borderLeft: '4px solid #722ed1' }}>
                        <Statistic 
                            title="Trạng thái" 
                            value={eventDetail.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'} 
                            valueStyle={{ color: eventDetail.status === 'APPROVED' ? '#52c41a' : '#faad14', fontSize: '18px' }}
                            prefix={eventDetail.status === 'APPROVED' ? <CheckCircleOutlined /> : <SyncOutlined spin />} 
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{eventDetail.location?.split(',').pop()}</Text>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                {/* Chart Section */}
                <Col xs={24} lg={8}>
                    <Card title="Phân bổ trạng thái đơn hàng" style={{ borderRadius: '12px', height: '100%' }}>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                {/* Orders Table Section */}
                <Col xs={24} lg={16}>
                    <Card 
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Danh sách đơn hàng thành công</span>
                                <Tag color="green">{orders.length} đơn</Tag>
                            </div>
                        } 
                        style={{ borderRadius: '12px' }}
                    >
                        <Table 
                            dataSource={orders} 
                            columns={columns} 
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            scroll={{ x: 'max-content' }}
                            locale={{ emptyText: 'Chưa có đơn hàng nào đã thanh toán' }}
                        />
                    </Card>
                </Col>
            </Row>

            <style dangerouslySetInnerHTML={{ __html: `
                .header-event-badge {
                    transition: all 0.3s ease;
                }
                .header-event-badge:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
            `}} />
        </div>
    );
};

export default EventStats;
