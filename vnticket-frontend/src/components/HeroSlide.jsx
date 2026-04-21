import React from 'react';
import { Typography, Button, Tag, Grid } from 'antd';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const formatCustomDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
};

const HeroSlide = ({ event }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    return (
        <div 
            style={{ 
                position: 'relative', 
                width: '100%', 
                height: isMobile ? '300px' : '600px',
                borderRadius: '16px', 
                overflow: 'hidden', 
                cursor: 'pointer' 
            }}
            onClick={() => navigate(`/event/${event.id}`)}
        >
            <img
                src={event.imageUrl}
                alt={event.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {!isMobile && (
                <>
                    {/* Overlay gradient mask */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%)',
                        pointerEvents: 'none'
                    }} />

                    {/* Event Content */}
                    <div style={{
                        position: 'absolute',
                        bottom: '8%',
                        left: '5%',
                        right: '5%',
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        zIndex: 10
                    }}>
                        <div>
                            <Tag
                                color={event.type === 'CONCERT' || event.type === 'Âm Nhạc' ? '#eb2f96' : '#1890ff'}
                                style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '100px', fontWeight: 'bold', border: 'none' }}
                            >
                                {event.type}
                            </Tag>
                        </div>

                        <Title level={1} style={{
                            color: 'white',
                            margin: 0,
                            fontSize: 'clamp(28px, 4vw, 48px)',
                            textShadow: '0 4px 12px rgba(0,0,0,0.6)',
                            lineHeight: '1.2'
                        }}>
                            {event.name}
                        </Title>

                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            flexWrap: 'wrap',
                            fontSize: 'clamp(14px, 2vw, 16px)',
                            opacity: 0.9,
                            fontWeight: '500'
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff', fontSize: '18px' }} />
                                {formatCustomDate(event.startTime)}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <EnvironmentOutlined style={{ marginRight: '8px', color: '#1890ff', fontSize: '18px' }} />
                                <span style={{
                                    maxWidth: '400px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: 'inline-block'
                                }}>
                                    {event.location}
                                </span>
                            </span>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <Button
                                type="primary"
                                size="large"
                                style={{
                                    padding: '0 40px',
                                    height: '52px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    borderRadius: '100px',
                                    boxShadow: '0 4px 15px rgba(24, 144, 255, 0.4)'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/event/${event.id}`);
                                }}
                            >
                                {t('common.buyNow')}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default HeroSlide;
