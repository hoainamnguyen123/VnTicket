import React from 'react';
import { Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatCustomDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day} tháng ${month}, ${year}`;
};

const FeaturedEventCard = ({ event }) => {
    const navigate = useNavigate();

    // Tính giá thấp nhất nếu có ticketTypes
    let minPrice = 0;
    if (event.ticketTypes && event.ticketTypes.length > 0) {
         minPrice = Math.min(...event.ticketTypes.map(t => t.price));
    }

    return (
        <div 
            onClick={() => navigate(`/event/${event.id}`)}
            style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                width: '100%',
                transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => {
                e.currentTarget.querySelector('img').style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.querySelector('img').style.transform = 'scale(1)';
            }}
        >
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden' }}>
                <img 
                    src={event.imageUrl} 
                    alt={event.name} 
                    style={{ 
                        width: '100%', height: '100%', objectFit: 'cover', 
                        transition: 'transform 0.4s ease' 
                    }} 
                />
            </div>
            
            <Title level={5} style={{ 
                color: '#1f1f1f', 
                margin: 0, 
                fontSize: '15px', 
                lineHeight: '1.4', 
                height: '42px', 
                overflow: 'hidden', 
                display: '-webkit-box', 
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical',
                transition: 'color 0.3s'
            }}>
                {event.name}
            </Title>
            
            <Text style={{ color: '#2ecc71', fontSize: '14px', fontWeight: 'bold' }}>
                Từ {formatCurrency(minPrice || (event.price || 0))}
            </Text>
            
            <div style={{ display: 'flex', alignItems: 'center', color: '#a0a0a0', fontSize: '13px' }}>
                <CalendarOutlined style={{ marginRight: '6px' }} />
                <span>{formatCustomDate(event.startTime)}</span>
            </div>
        </div>
    );
};

export default FeaturedEventCard;
