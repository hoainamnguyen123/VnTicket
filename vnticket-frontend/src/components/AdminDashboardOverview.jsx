import { Button, Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  RightOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Paragraph, Text, Title } = Typography;

const formatRevenue = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

const AdminDashboardOverview = ({
  stats,
  pendingCount,
  approvedCount,
  rejectedCount,
  onCreateEvent,
  onOpenPending,
}) => {
  const { t } = useTranslation();
  const paymentRate = Math.round(
    ((stats?.totalTicketsPaid || 0) / (stats?.totalTicketsBooked || 1)) * 100,
  );
  const totalEvents = pendingCount + approvedCount + rejectedCount;

  const metrics = [
    {
      title: t('admin.totalBookings', 'Tổng booking'),
      value: stats?.totalBookings || 0,
      icon: <ShoppingCartOutlined />,
      color: '#1677ff',
      background: '#e6f4ff',
    },
    {
      title: t('admin.bookedTickets', 'Vé đã đặt'),
      value: stats?.totalTicketsBooked || 0,
      icon: <TeamOutlined />,
      color: '#722ed1',
      background: '#f9f0ff',
    },
    {
      title: t('admin.paidTickets', 'Đã thanh toán'),
      value: stats?.totalTicketsPaid || 0,
      icon: <CheckCircleOutlined />,
      color: '#389e0d',
      background: '#f6ffed',
    },
    {
      title: t('admin.totalRevenue', 'Tổng doanh thu'),
      value: formatRevenue(stats?.totalRevenue),
      icon: <DollarOutlined />,
      color: '#cf1322',
      background: '#fff1f0',
    },
  ];

  return (
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      <Card
        styles={{ body: { padding: 0 } }}
        style={{
          overflow: 'hidden',
          border: 0,
          borderRadius: 20,
          background: 'linear-gradient(125deg, #102a56 0%, #1358a8 55%, #1677ff 100%)',
          boxShadow: '0 18px 45px rgba(22, 119, 255, 0.22)',
        }}
      >
        <Row align="middle" gutter={[24, 24]} style={{ padding: '28px clamp(20px, 4vw, 42px)' }}>
          <Col xs={24} lg={15}>
            <Tag color="blue" style={{ marginBottom: 12, border: 0 }}>
              VNTicket Control Center
            </Tag>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              {t('admin.dashboardTitle', 'Trung tâm điều hành')}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,.78)', margin: '8px 0 20px', maxWidth: 620 }}>
              {t(
                'admin.dashboardSubtitle',
                'Theo dõi doanh thu, duyệt sự kiện và xử lý vận hành từ một màn hình.',
              )}
            </Paragraph>
            <Space wrap>
              <Button type="primary" ghost icon={<PlusOutlined />} onClick={onCreateEvent}>
                {t('admin.createDirectly', 'Tạo sự kiện')}
              </Button>
              <Button icon={<ClockCircleOutlined />} onClick={onOpenPending}>
                {t('admin.processPending', 'Xử lý chờ duyệt')}
                <RightOutlined />
              </Button>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Card
              variant="borderless"
              style={{ background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)' }}
            >
              <Text style={{ color: 'rgba(255,255,255,.72)' }}>
                {t('admin.approvalQueue', 'Hàng đợi phê duyệt')}
              </Text>
              <Title level={3} style={{ color: '#fff', margin: '6px 0 14px' }}>
                {pendingCount} sự kiện chờ duyệt
              </Title>
              <Progress
                percent={totalEvents ? Math.round((approvedCount / totalEvents) * 100) : 0}
                showInfo={false}
                strokeColor="#69c0ff"
                railColor="rgba(255,255,255,.16)"
              />
              <Space style={{ marginTop: 10 }} wrap>
                <Tag color="success">{approvedCount} đã duyệt</Tag>
                <Tag color="error">{rejectedCount} từ chối</Tag>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col xs={24} sm={12} xl={6} key={metric.title}>
            <Card
              style={{ borderRadius: 16, height: '100%' }}
              styles={{ body: { padding: 20 } }}
            >
              <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Statistic
                  title={metric.title}
                  value={metric.value}
                  styles={{ content: { fontSize: 25, fontWeight: 700 } }}
                />
                <span style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  fontSize: 20,
                  color: metric.color,
                  background: metric.background,
                }}>
                  {metric.icon}
                </span>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 16 }}>
        <Row align="middle" gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <Text type="secondary">{t('admin.paymentRate', 'Tỷ lệ thanh toán')}</Text>
            <Title level={2} style={{ margin: '4px 0 0' }}>{paymentRate}%</Title>
          </Col>
          <Col xs={24} md={16}>
            <Progress
              percent={paymentRate}
              strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }}
              railColor="#f0f0f0"
            />
          </Col>
        </Row>
      </Card>
    </Space>
  );
};

export default AdminDashboardOverview;
