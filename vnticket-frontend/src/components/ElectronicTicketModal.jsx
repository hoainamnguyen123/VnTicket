import React from 'react';
import { Modal, Carousel, Typography, Row, Col, Tag, Divider, Empty } from 'antd';
import { QRCodeCanvas } from 'qrcode.react';
import { formatCurrency, formatDate } from '../utils/formatters';

const { Title, Text } = Typography;

const ElectronicTicketModal = ({ visible, onClose, tickets }) => {

    const renderTicket = (ticket) => (
        <div key={ticket.id} style={{ padding: '10px' }}>
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: '1px solid #f0f0f0'
            }}>
                {/* Event Image Banner */}
                <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                    <img
                        src={ticket.eventImageUrl || 'https://via.placeholder.com/800x400?text=Event+Image'}
                        alt="Event"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: ticket.status === 'VALID' ? '#52c41a' : (ticket.status === 'USED' ? '#faad14' : '#ff4d4f'),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                        {ticket.status === 'VALID' ? 'HỢP LỆ' : (ticket.status === 'USED' ? 'ĐÃ SỬ DỤNG' : 'ĐÃ HỦY')}
                    </div>
                </div>

                {/* Event Details */}
                <div style={{ padding: '24px' }}>
                    <Title level={4} style={{ margin: '0 0 16px 0', color: '#1890ff' }}>
                        {ticket.eventName}
                    </Title>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Text type="secondary">Thời gian:</Text><br />
                            <Text strong>{ticket.startTime ? formatDate(ticket.startTime) : 'Chưa cập nhật'}</Text>
                        </Col>
                        <Col span={24}>
                            <Text type="secondary">Địa điểm:</Text><br />
                            <Text strong>{ticket.eventLocation}</Text>
                        </Col>
                    </Row>
                </div>

                {/* Divider with cutout effect */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                        position: 'absolute', left: '-10px', boxShadow: 'inset -3px 0 5px rgba(0,0,0,0.05)',
                        borderRight: '1px solid #f0f0f0', zIndex: 1
                    }}></div>
                    <Divider dashed style={{ margin: 0, borderColor: '#d9d9d9', flex: 1 }} />
                    <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                        position: 'absolute', right: '-10px', boxShadow: 'inset 3px 0 5px rgba(0,0,0,0.05)',
                        borderLeft: '1px solid #f0f0f0', zIndex: 1
                    }}></div>
                </div>

                {/* Ticket Details & QR */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fafafa' }}>
                    <Row gutter={16} style={{ width: '100%', marginBottom: '24px', textAlign: 'center' }}>
                        <Col span={12}>
                            <Text type="secondary">Khu vực</Text><br />
                            <Title level={5} style={{ margin: 0 }}>{ticket.zoneName}</Title>
                        </Col>
                        <Col span={12}>
                            <Text type="secondary">Giá vé</Text><br />
                            <Title level={5} style={{ margin: 0, color: '#f5222d' }}>{formatCurrency(ticket.price)}</Title>
                        </Col>
                    </Row>

                    {/* The magical QR Code */}
                    <div style={{
                        background: 'white', padding: '16px', borderRadius: '12px',
                        border: '1px solid #f0f0f0', display: 'inline-block', marginBottom: '16px'
                    }}>
                        <QRCodeCanvas
                            value={ticket.ticketCode}
                            size={180}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"H"}
                            includeMargin={false}
                        />
                    </div>

                    <Text type="secondary" style={{ fontSize: '12px' }}>Mã vé điện tử</Text>
                    <Text strong style={{ fontSize: '18px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                        {ticket.ticketCode}
                    </Text>
                </div>
            </div>
        </div>
    );

    return (
        <Modal
            title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Vé Điện Tử Của Bạn</span>}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={480}
            centered
            bodyStyle={{ padding: '20px 0', background: '#f0f2f5' }}
        >
            {tickets && tickets.length > 0 ? (
                <Carousel autoplay={false} dots={true} effect="fade">
                    {tickets.map(ticket => renderTicket(ticket))}
                </Carousel>
            ) : (
                <div style={{ padding: '40px' }}><Empty description="Không tìm thấy vé hợp lệ" /></div>
            )}
        </Modal>
    );
};

export default ElectronicTicketModal;
