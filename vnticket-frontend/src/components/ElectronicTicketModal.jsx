import React from 'react';
import { Modal, Carousel, Typography, Row, Col, Tag, Divider, Empty } from 'antd';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';

const { Title, Text } = Typography;

const ElectronicTicketModal = ({ visible, onClose, tickets }) => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);

    const renderTicket = (ticket, index, totalLength) => (
        <div key={ticket.id} style={{ padding: '10px' }}>
            <div style={{
                background: isDark ? '#1f1f1f' : '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: isDark ? '1px solid #434343' : '1px solid #f0f0f0'
            }}>
                {/* Event Image Banner */}
                <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                    <img
                        src={ticket.eventImageUrl || 'https://via.placeholder.com/800x400?text=Event+Image'}
                        alt="Event"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {totalLength > 1 && (
                        <div style={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                            {t('eTicket.ticketOf', { current: index + 1, total: totalLength })}
                        </div>
                    )}
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
                        {ticket.status === 'VALID' ? t('eTicket.valid') : (ticket.status === 'USED' ? t('eTicket.used') : t('eTicket.invalidStatus'))}
                    </div>
                </div>

                {/* Event Details */}
                <div style={{ padding: '24px' }}>
                    <Title level={4} style={{ margin: '0 0 16px 0', color: '#1890ff' }}>
                        {ticket.eventName}
                    </Title>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Text type="secondary">{t('eTicket.time')}</Text><br />
                            <Text strong>{ticket.startTime ? formatDate(ticket.startTime) : t('common.notUpdated')}</Text>
                        </Col>
                        <Col span={24}>
                            <Text type="secondary">{t('eTicket.location')}</Text><br />
                            <Text strong>{ticket.eventLocation}</Text>
                        </Col>
                    </Row>
                </div>

                {/* Divider with cutout effect */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', background: isDark ? '#141414' : '#f0f2f5',
                        position: 'absolute', left: '-10px', boxShadow: isDark ? 'inset -3px 0 5px rgba(0,0,0,0.5)' : 'inset -3px 0 5px rgba(0,0,0,0.05)',
                        borderRight: isDark ? '1px solid #434343' : '1px solid #f0f0f0', zIndex: 1
                    }}></div>
                    <Divider dashed style={{ margin: 0, borderColor: isDark ? '#434343' : '#d9d9d9', flex: 1 }} />
                    <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', background: isDark ? '#141414' : '#f0f2f5',
                        position: 'absolute', right: '-10px', boxShadow: isDark ? 'inset 3px 0 5px rgba(0,0,0,0.5)' : 'inset 3px 0 5px rgba(0,0,0,0.05)',
                        borderLeft: isDark ? '1px solid #434343' : '1px solid #f0f0f0', zIndex: 1
                    }}></div>
                </div>

                {/* Ticket Details & QR */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: isDark ? '#262626' : '#fafafa' }}>
                    <Row gutter={16} style={{ width: '100%', marginBottom: '24px', textAlign: 'center' }}>
                        <Col span={12}>
                            <Text type="secondary">{t('eTicket.zone')}</Text><br />
                            <Title level={5} style={{ margin: 0 }}>{ticket.zoneName}</Title>
                        </Col>
                        <Col span={12}>
                            <Text type="secondary">{t('eTicket.ticketPrice')}</Text><br />
                            <Title level={5} style={{ margin: 0, color: '#f5222d' }}>{formatCurrency(ticket.price)}</Title>
                        </Col>
                    </Row>

                    {/* The magical QR Code */}
                    <div style={{
                        background: 'white', padding: '16px', borderRadius: '12px',
                        border: isDark ? '1px solid #434343' : '1px solid #f0f0f0', display: 'inline-block', marginBottom: '16px'
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

                    <Text type="secondary" style={{ fontSize: '12px' }}>{t('eTicket.eTicketCode')}</Text>
                    <Text strong style={{ fontSize: '18px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                        {ticket.ticketCode}
                    </Text>
                </div>
            </div>
        </div>
    );

    return (
        <Modal
            title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>{t('eTicket.title')}</span>}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={480}
            centered
            bodyStyle={{ padding: '20px 0', background: isDark ? '#141414' : '#f0f2f5' }}
        >
            {tickets && tickets.length > 0 ? (
                <>
                    <style>{`
                        .ant-carousel .slick-prev,
                        .ant-carousel .slick-next,
                        .ant-carousel .slick-prev:hover,
                        .ant-carousel .slick-next:hover {
                            color: #1890ff !important;
                            font-size: 20px !important;
                            width: 30px;
                            height: 30px;
                            z-index: 2;
                        }
                        .ant-carousel .slick-prev {
                            left: 10px;
                        }
                        .ant-carousel .slick-next {
                            right: 10px;
                        }
                        .ant-carousel .slick-prev::before,
                        .ant-carousel .slick-next::before {
                            color: #1890ff !important;
                        }
                    `}</style>
                    <Carousel arrows autoplay={false} dots={true} effect="fade">
                        {tickets.map((ticket, index) => renderTicket(ticket, index, tickets.length))}
                    </Carousel>
                </>
            ) : (
                <div style={{ padding: '40px' }}><Empty description={t('eTicket.noValidTickets')} /></div>
            )}
        </Modal>
    );
};

export default ElectronicTicketModal;
