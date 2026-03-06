import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Typography, Card, Button, InputNumber, Divider, Table, Tag, message, Skeleton, Modal, Switch, Image } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarOutlined, EnvironmentOutlined, CheckCircleOutlined, ExclamationCircleOutlined, UserOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AuthContext } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [bookingLoading, setBookingLoading] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchEventDetail = async () => {
            try {
                const response = await axiosClient.get(`/events/${id}`);
                setEvent(response.data);
            } catch (error) {
                message.error('Không thể tải chi tiết sự kiện!');
            } finally {
                setLoading(false);
            }
        };
        fetchEventDetail();
    }, [id]);

    const handleBookTicket = async () => {
        if (!user) {
            message.warning('Vui lòng đăng nhập để đặt vé!');
            navigate('/login');
            return;
        }

        if (!selectedTicket) {
            message.warning('Vui lòng chọn loại vé!');
            return;
        }

        setBookingLoading(true);
        try {
            await axiosClient.post('/bookings', {
                eventId: event.id,
                ticketTypeId: selectedTicket.id,
                quantity: quantity
            });

            Modal.success({
                title: 'Đặt vé thành công!',
                content: 'Bạn có thể xem lại thông tin vé trong phần Lịch sử đặt vé.',
                onOk: () => navigate('/history')
            });
        } catch (error) {
            message.error(error.message || 'Có lỗi xảy ra khi đặt vé!');

            // If Optimistic Locking Exception
            if (error.status === 409) {
                Modal.error({
                    title: 'Vé đã thay đổi',
                    content: 'Số lượng vé cho khu vực này vừa được cập nhật bởi người khác. Vui lòng tải lại trang.',
                    onOk: () => window.location.reload()
                });
            }
        } finally {
            setBookingLoading(false);
        }
    };

    const columns = [
        { title: 'Khu vực', dataIndex: 'zoneName', key: 'zoneName', render: text => <strong style={{ color: '#1890ff' }}>{text}</strong> },
        { title: 'Giá vé', dataIndex: 'price', key: 'price', render: price => <strong>{formatCurrency(price)}</strong> },
        {
            title: 'Còn lại', dataIndex: 'remainingQuantity', key: 'remainingQuantity', render: qty => (
                <Tag color={qty > 0 ? 'green' : 'red'}>{qty > 0 ? `${qty} vé` : 'Hết vé'}</Tag>
            )
        },
        {
            title: 'Chọn',
            key: 'action',
            render: (_, record) => (
                <Switch
                    checked={selectedTicket?.id === record.id}
                    onChange={(checked) => setSelectedTicket(checked ? record : null)}
                    disabled={record.remainingQuantity <= 0}
                />
            ),
        },
    ];

    if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;
    if (!event) return <div style={{ textAlign: 'center', marginTop: 50 }}>Không tìm thấy sự kiện!</div>;

    return (
        <div>
            <Row gutter={[32, 32]}>
                <Col xs={24} md={12}>
                    <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <Image.PreviewGroup>
                            <Image
                                src={event.imageUrl}
                                alt={event.name}
                                style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                            />
                            {event.additionalImages && event.additionalImages.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px', padding: '8px', overflowX: 'auto', background: '#f0f2f5' }}>
                                    {event.additionalImages.map((imgUrl, index) => (
                                        <Image
                                            key={index}
                                            src={imgUrl}
                                            alt={`Ảnh phụ ${index + 1}`}
                                            width={80}
                                            height={60}
                                            style={{ objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #d9d9d9' }}
                                        />
                                    ))}
                                </div>
                            )}
                        </Image.PreviewGroup>
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    <Tag color={event.type === 'CONCERT' ? 'magenta' : 'geekblue'} style={{ marginBottom: 16 }}>
                        {event.type}
                    </Tag>
                    <Title level={2} style={{ marginTop: 0 }}>{event.name}</Title>

                    <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '16px' }}>
                        <Text><CalendarOutlined style={{ color: '#1890ff', marginRight: 10 }} /> <strong>Thời gian:</strong> {formatDate(event.startTime)}</Text>
                        <Text><UserOutlined style={{ color: '#1890ff', marginRight: 10 }} /> <strong>Ban tổ chức:</strong> {event.organizerName || 'Chưa cập nhật'}</Text>
                        <Text><EnvironmentOutlined style={{ color: '#1890ff', marginRight: 10 }} /> <strong>Địa điểm:</strong> {event.location || 'Chưa cập nhật'}</Text>
                    </div>

                    <Card title="Chọn loại vé" bordered={false} style={{ background: '#f9f9f9', borderRadius: '12px' }}>
                        <Table
                            dataSource={event.ticketTypes}
                            columns={columns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content' }}
                        />

                        <Divider />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Text strong>Số lượng: </Text>
                                <InputNumber
                                    min={1}
                                    max={selectedTicket ? selectedTicket.remainingQuantity : 10}
                                    value={quantity}
                                    onChange={setQuantity}
                                    disabled={!selectedTicket}
                                />
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: '14px' }}>Tổng tiền: </Text>
                                <Title level={3} style={{ margin: 0, color: '#f5222d' }}>
                                    {selectedTicket ? formatCurrency(selectedTicket.price * quantity) : '0 ₫'}
                                </Title>
                            </div>
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            block
                            style={{ marginTop: '20px', height: '50px', fontSize: '16px', borderRadius: '8px' }}
                            onClick={handleBookTicket}
                            loading={bookingLoading}
                            disabled={!selectedTicket}
                        >
                            ĐẶT VÉ NGAY
                        </Button>
                    </Card>
                </Col>
            </Row>

            <Divider orientation="left"><Title level={3}>Giới thiệu sự kiện</Title></Divider>
            <div style={{ fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                <Paragraph>{event.description}</Paragraph>
            </div>

        </div>
    );
};

export default EventDetail;
