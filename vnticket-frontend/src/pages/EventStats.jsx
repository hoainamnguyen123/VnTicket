import { useContext, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Grid,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import dayjs from 'dayjs';
import axiosClient from '../api/axiosClient';
import ExportReportButtons from '../components/ExportReportButtons';
import { ThemeContext } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatters';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const fetchEventStats = async (eventId, isAdmin) => {
  const statsUrl = isAdmin
    ? `/bookings/statistics/event/${eventId}`
    : `/bookings/statistics/my-event/${eventId}`;
  const ordersUrl = isAdmin
    ? `/bookings/event/${eventId}/paid`
    : `/bookings/my-event/${eventId}/paid`;

  const [statsResponse, ordersResponse, eventResponse] = await Promise.all([
    axiosClient.get(statsUrl),
    axiosClient.get(ordersUrl),
    axiosClient.get(`/events/${eventId}`),
  ]);

  return {
    stats: statsResponse.data,
    orders: ordersResponse.data || [],
    eventDetail: eventResponse.data,
  };
};

const EventStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useContext(ThemeContext);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isAdmin = location.pathname.startsWith('/admin');

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['event-statistics', id, isAdmin],
    queryFn: () => fetchEventStats(id, isAdmin),
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  const stats = data?.stats;
  const orders = data?.orders || [];
  const eventDetail = data?.eventDetail;

  const columns = useMemo(() => [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (value) => <Text copyable>#{value}</Text>,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Text strong><UserOutlined /> {record.username}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.phone || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'bookingTime',
      key: 'bookingTime',
      responsive: ['lg'],
      render: (value) => dayjs(value).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Chi tiết vé',
      key: 'details',
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          {record.bookingDetails?.map((detail) => (
            <span key={`${record.id}-${detail.ticketTypeId || detail.zoneName}`}>
              <Tag color="blue">{detail.zoneName}</Tag>
              x{detail.quantity}
            </span>
          ))}
        </Space>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (value) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(value || 0)}
        </Text>
      ),
    },
  ], []);

  const pieData = useMemo(() => {
    if (!stats) {
      return [];
    }
    return [
      { name: 'Đã thanh toán', value: stats.paidBookings || 0, color: '#52c41a' },
      { name: 'Chờ xử lý', value: stats.pendingBookings || 0, color: '#faad14' },
      { name: 'Đã hủy', value: stats.cancelledBookings || 0, color: '#ff4d4f' },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Đang tải dữ liệu thống kê..." />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải thống kê sự kiện"
        description="Vui lòng kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
        action={(
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Thử lại
          </Button>
        )}
      />
    );
  }

  if (!stats || !eventDetail) {
    return <Empty description="Không tìm thấy dữ liệu sự kiện" />;
  }

  const paymentRate = Math.round(
    ((stats.totalTicketsPaid || 0) / (stats.totalTicketsBooked || 1)) * 100,
  );

  return (
    <main style={{ padding: isMobile ? 12 : 24, maxWidth: 1400, margin: '0 auto' }}>
      <header style={{
        marginBottom: 24,
        display: 'flex',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16,
      }}>
        <Space orientation="vertical" size={4}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            Thống kê: {eventDetail.name}
          </Title>
          <Space split={<Divider type="vertical" />} wrap>
            <Text type="secondary">
              <CalendarOutlined /> {dayjs(eventDetail.startTime).format('DD/MM/YYYY HH:mm')}
            </Text>
            <Tag color="cyan">{eventDetail.type}</Tag>
          </Space>
        </Space>

        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined spin={isFetching} />}
          onClick={() => refetch()}
        >
          Làm mới dữ liệu
        </Button>
      </header>

      <Card
        size="small"
        style={{
          marginBottom: 16,
          borderRadius: 12,
          background: isDark ? '#1d1d1d' : '#e6f7ff',
          border: 0,
        }}
      >
        <Text type="secondary">Ban tổ chức: </Text>
        <Text strong>{eventDetail.organizerName || 'N/A'}</Text>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="Tổng doanh thu"
              value={stats.totalRevenue}
              formatter={(value) => formatCurrency(value || 0)}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
              prefix={<DollarCircleOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Thực nhận sau phí 2%: <Text strong>{formatCurrency((stats.totalRevenue || 0) * 0.98)}</Text>
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="Vé bán thành công"
              value={stats.totalTicketsPaid}
              suffix={`/ ${stats.totalTicketsBooked}`}
              prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tỷ lệ thanh toán: {paymentRate}%
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, borderLeft: '4px solid #faad14' }}>
            <Statistic
              title="Số đơn đặt hàng"
              value={stats.totalBookings}
              prefix={<ShoppingCartOutlined style={{ color: '#faad14' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {stats.pendingBookings} đơn đang chờ
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, borderLeft: '4px solid #722ed1' }}>
            <Statistic
              title="Trạng thái"
              value={eventDetail.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
              valueStyle={{
                color: eventDetail.status === 'APPROVED' ? '#52c41a' : '#faad14',
                fontSize: 18,
              }}
              prefix={eventDetail.status === 'APPROVED'
                ? <CheckCircleOutlined />
                : <SyncOutlined spin />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {eventDetail.location?.split(',').pop()}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Phân bổ trạng thái đơn hàng" style={{ borderRadius: 12, height: '100%' }}>
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
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={(
              <div style={{ padding: '8px 0 4px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <span>Đơn hàng thanh toán thành công</span>
                  <Tag color="green" style={{ margin: 0 }}>{orders.length} đơn</Tag>
                </div>
                <div style={{ marginTop: 12 }}>
                  <ExportReportButtons
                    eventId={id}
                    eventName={eventDetail.name}
                    isAdmin={isAdmin}
                    align="start"
                  />
                </div>
              </div>
            )}
            style={{ borderRadius: 12 }}
          >
            <Table
              dataSource={orders}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: 'Chưa có đơn hàng đã thanh toán' }}
            />
          </Card>
        </Col>
      </Row>
    </main>
  );
};

export default EventStats;
