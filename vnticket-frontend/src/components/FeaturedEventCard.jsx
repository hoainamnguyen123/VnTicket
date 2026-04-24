import React, { useContext } from 'react';
import { Typography } from 'antd';
import { CalendarOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { Tag, Grid } from 'antd';

const { Title, Text } = Typography;

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatCustomDate = (dateString, lang) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (lang === 'en') {
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day} tháng ${month}, ${year}`;
};

const FeaturedEventCard = ({ event }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { isDark } = useContext(ThemeContext);

    // Tính giá thấp nhất nếu có ticketTypes
    let minPrice = 0;
    if (event.ticketTypes && event.ticketTypes.length > 0) {
        minPrice = Math.min(...event.ticketTypes.map(t => t.price));
    }

    // Status Badge Logic
    const now = new Date();
    const eventDate = new Date(event.startTime);
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let statusBadge = null;
    if (diffDays <= 0) {
        statusBadge = <Tag color="default" style={{ borderRadius: '6px', margin: 0, fontWeight: 600 }}>{t('common.ended', '✅ Đã diễn ra')}</Tag>;
    }

    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    return (
        <div
            onClick={() => navigate(`/event/${event.id}`)}
            style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '8px' : '12px',
                boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.06)',
                width: '100%',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                background: isDark ? 'transparent' : '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                border: isDark ? `1px solid #303030` : 'none'
            }}
            onMouseOver={(e) => {
                e.currentTarget.querySelector('img').style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.querySelector('img').style.transform = 'scale(1)';
            }}
        >
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, transform: isMobile ? 'scale(0.85)' : 'none', transformOrigin: 'right top' }}>
                    {statusBadge}
                </div>
                <img
                    src={event.imageUrl}
                    alt={event.name}
                    style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform 0.4s ease'
                    }}
                />
            </div>

            <div style={{ padding: isMobile ? '0 8px 12px 8px' : '0 12px 16px 12px', display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : '8px' }}>
                <Title level={5} style={{
                    color: isDark ? '#e8e8e8' : '#1f1f1f',
                    margin: 0,
                    fontSize: isMobile ? '13px' : '15px',
                    lineHeight: '1.4',
                    height: isMobile ? '36px' : '42px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    transition: 'color 0.3s'
                }}>
                    {event.name}
                </Title>

                <Text style={{ color: '#2ecc71', fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold' }}>
                    {t('common.from')} {formatCurrency(minPrice || (event.price || 0))}
                </Text>

                <div style={{ display: 'flex', alignItems: 'center', color: '#a0a0a0', fontSize: isMobile ? '11px' : '13px' }}>
                    <CalendarOutlined style={{ marginRight: '6px' }} />
                    <span>{formatCustomDate(event.startTime, i18n.language)}</span>
                </div>
            </div>
        </div>
    );
};

export default FeaturedEventCard;
