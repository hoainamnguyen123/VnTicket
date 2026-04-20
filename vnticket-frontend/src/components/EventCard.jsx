import React from 'react';
import { Card, Tag, Button, Typography } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { formatDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const EventCard = ({ event }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Status Badge Logic
    const now = new Date();
    const eventDate = new Date(event.startTime);
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let statusBadge = null;
    if (diffDays <= 0) {
        statusBadge = <Tag color="default" style={{ borderRadius: '4px', margin: 0, fontWeight: 500 }}>{t('common.ended', '✅ Đã diễn ra')}</Tag>;
    }

    return (
        <Card
            hoverable
            style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}
            onClick={() => navigate(`/event/${event.id}`)}
            cover={
                <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                        {statusBadge}
                    </div>
                    <img
                        alt={event.name}
                        src={event.imageUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                </div>
            }
            actions={[
                <Button 
                    type="primary" 
                    size="large" 
                    disabled={diffDays <= 0}
                    onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.id}`); }} 
                    style={{ width: '90%', borderRadius: '6px' }}
                >
                    {diffDays <= 0 ? t('common.ended', 'Đã diễn ra') : t('common.buyNow')}
                </Button>
            ]}
        >
            <div style={{ marginBottom: '10px' }}>
                <Tag color={event.type === 'CONCERT' ? 'magenta' : 'geekblue'}>
                    {event.type}
                </Tag>
            </div>

            <Title level={4} ellipsis={{ rows: 2 }} style={{ marginTop: 0, minHeight: '56px' }}>
                {event.name}
            </Title>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#595959' }}>
                <Text><CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />{formatDate(event.startTime)}</Text>
                <Text ellipsis><EnvironmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} />{event.location}</Text>
            </div>
        </Card>
    );
};

export default EventCard;
