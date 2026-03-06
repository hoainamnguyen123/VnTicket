import React from 'react';
import { Card, Tag, Button, Typography } from 'antd';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { formatDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Meta } = Card;

const EventCard = ({ event }) => {
    const navigate = useNavigate();

    return (
        <Card
            hoverable
            style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}
            onClick={() => navigate(`/event/${event.id}`)}
            cover={
                <div style={{ height: '220px', overflow: 'hidden' }}>
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
                <Button type="primary" size="large" onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.id}`); }} style={{ width: '90%', borderRadius: '6px' }}>
                    Mua vé ngay
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
