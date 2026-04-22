import React, { useState } from 'react';
import { Modal, Carousel, Typography, Row, Col, Tag, Divider, Empty, Button, Input, Alert, message, Grid } from 'antd';
import { SwapOutlined, MailOutlined } from '@ant-design/icons';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';
import axiosClient from '../api/axiosClient';

const { Title, Text } = Typography;

const ElectronicTicketModal = ({ visible, onClose, tickets, onTicketTransferred }) => {
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const screens = Grid.useBreakpoint();

    // Transfer modal state
    const [transferModalVisible, setTransferModalVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);

    const handleOpenTransfer = (ticket) => {
        setSelectedTicket(ticket);
        setRecipientEmail('');
        setTransferModalVisible(true);
    };

    const handleTransfer = async () => {
        if (!recipientEmail || !recipientEmail.includes('@')) {
            message.warning(t('ticketTransfer.recipientEmailRequired'));
            return;
        }

        setTransferLoading(true);
        try {
            const response = await axiosClient.post('/tickets/transfer', {
                ticketId: selectedTicket.id,
                recipientEmail: recipientEmail,
            });
            const result = response.data;
            message.success(t('ticketTransfer.transferSuccessDetail', {
                email: recipientEmail
            }));
            setTransferModalVisible(false);
            setSelectedTicket(null);
            // Callback to refresh ticket list
            if (onTicketTransferred) {
                onTicketTransferred();
            }
        } catch (error) {
            message.error(error.message || t('ticketTransfer.transferError'));
        } finally {
            setTransferLoading(false);
        }
    };

    const getStatusBadge = (ticket) => {
        if (ticket.status === 'VALID') {
            return { bg: '#52c41a', text: t('eTicket.valid') };
        } else if (ticket.status === 'USED') {
            return { bg: '#faad14', text: t('eTicket.used') };
        } else if (ticket.status === 'TRANSFERRED') {
            return { bg: '#722ed1', text: t('eTicket.transferred') };
        } else {
            return { bg: '#ff4d4f', text: t('eTicket.invalidStatus') };
        }
    };

    const renderTicket = (ticket, index, totalLength) => {
        const statusBadge = getStatusBadge(ticket);

        return (
            <div key={ticket.id} style={{ padding: '10px' }}>
                <div style={{
                    background: isDark ? '#1f1f1f' : '#fff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: isDark ? '1px solid #434343' : '1px solid #f0f0f0',
                    opacity: ticket.status === 'TRANSFERRED' ? 0.6 : 1
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
                            background: statusBadge.bg,
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                            {statusBadge.text}
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

                        {/* QR Code - only show for VALID tickets */}
                        {ticket.status === 'VALID' ? (
                            <>
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
                                <Text strong style={{ fontSize: '18px', letterSpacing: '2px', fontFamily: 'monospace', marginBottom: '16px' }}>
                                    {ticket.ticketCode}
                                </Text>

                                {/* Transfer Button */}
                                <Button
                                    type="default"
                                    icon={<SwapOutlined />}
                                    onClick={() => handleOpenTransfer(ticket)}
                                    style={{
                                        marginTop: '8px',
                                        borderColor: '#722ed1',
                                        color: '#722ed1',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#722ed1';
                                        e.currentTarget.style.color = '#fff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#722ed1';
                                    }}
                                >
                                    {t('eTicket.transferBtn')}
                                </Button>
                            </>
                        ) : ticket.status === 'TRANSFERRED' ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <SwapOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '12px' }} />
                                <br />
                                <Text type="secondary" style={{ fontSize: '14px' }}>{t('eTicket.transferred')}</Text>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Modal
                title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>{t('eTicket.title')}</span>}
                open={visible}
                onCancel={onClose}
                footer={null}
                width={screens.xs ? '95%' : 480}
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

            {/* Transfer Confirmation Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <SwapOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600 }}>{t('ticketTransfer.modalTitle')}</span>
                    </div>
                }
                open={transferModalVisible}
                onCancel={() => { setTransferModalVisible(false); setSelectedTicket(null); }}
                footer={[
                    <Button key="cancel" onClick={() => { setTransferModalVisible(false); setSelectedTicket(null); }}>
                        {t('common.cancel')}
                    </Button>,
                    <Button
                        key="confirm"
                        type="primary"
                        loading={transferLoading}
                        disabled={!recipientEmail}
                        onClick={handleTransfer}
                        style={{
                            background: recipientEmail ? 'linear-gradient(135deg, #722ed1, #9254de)' : undefined,
                            borderColor: recipientEmail ? 'transparent' : undefined,
                        }}
                    >
                        {t('ticketTransfer.confirmTransfer')}
                    </Button>
                ]}
                width={screens.xs ? '95%' : 460}
                centered
            >
                {selectedTicket && (
                    <div style={{ padding: '8px 0' }}>
                        {/* Ticket info summary */}
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
                                <Text><strong>{t('ticketTransfer.event')}:</strong> {selectedTicket.eventName}</Text>
                                <Text><strong>{t('ticketTransfer.zone')}:</strong> {selectedTicket.zoneName}</Text>
                                <Text><strong>{t('ticketTransfer.ticketCode')}:</strong> <code>{selectedTicket.ticketCode}</code></Text>
                            </div>
                        </div>

                        {/* Recipient email input */}
                        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                            {t('ticketTransfer.recipientEmail')}
                        </Text>
                        <Input
                            prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder={t('ticketTransfer.recipientEmailPlaceholder')}
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            size="large"
                            style={{ borderRadius: '8px', marginBottom: '16px' }}
                        />

                        {/* Warning */}
                        <Alert
                            type="warning"
                            showIcon
                            message={t('ticketTransfer.warning')}
                            style={{ borderRadius: '8px' }}
                        />
                    </div>
                )}
            </Modal>
        </>
    );
};

export default ElectronicTicketModal;
