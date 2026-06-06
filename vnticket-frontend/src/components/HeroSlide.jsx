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
    const isMobile = !screens.lg; // Chuyển sang lg (992px) để bao quát cả iPad/Tablet

    return (
        <div
            style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: isMobile ? 'none' : '1280px', 
                aspectRatio: isMobile ? '4/3' : '21/9', // Tăng độ rộng cho PC để hợp poster ngang
                margin: isMobile ? '0' : '0 auto', 
                borderRadius: isMobile ? '0' : '16px', 
                overflow: 'hidden', 
                cursor: 'pointer',
                background: '#000'
            }}
            onClick={() => navigate(`/event/${event.id}`)}
        >
            {/* Lớp nền mờ bên dưới để lấp đầy khoảng trống */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `url(${event.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(15px) brightness(0.5)',
                transform: 'scale(1.1)',
                zIndex: 0
            }} />

            {/* Ảnh chính hiển thị trọn vẹn */}
            <img
                src={event.imageUrl}
                alt={event.name}
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain', 
                    position: 'relative', 
                    zIndex: 1 
                }}
            />

            {!isMobile && (
                <>
                    {/* Overlay gradient mask */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)',
                        pointerEvents: 'none'
                    }} />

                    {/* Event Content - Compact Bottom Bar */}
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        color: 'white',
                        padding: '15px 30px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0) 100%)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '20px',
                        zIndex: 10
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            flex: 1,
                            minWidth: 0 // Allows text truncation to work
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Tag
                                    color={event.type === 'CONCERT' || event.type === 'Âm Nhạc' ? '#eb2f96' : '#1890ff'}
                                    style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '4px', fontWeight: 'bold', border: 'none', margin: 0 }}
                                >
                                    {event.type}
                                </Tag>
                                <Title level={3} style={{
                                    color: 'white',
                                    margin: 0,
                                    fontSize: 'clamp(16px, 1.8vw, 22px)',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                    lineHeight: '1.2',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {event.name}
                                </Title>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '20px',
                                flexWrap: 'wrap',
                                fontSize: 'clamp(12px, 1.3vw, 14px)',
                                opacity: 0.85,
                                fontWeight: '500'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarOutlined style={{ marginRight: '6px', color: '#1890ff', fontSize: '14px' }} />
                                    {formatCustomDate(event.startTime)}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                    <EnvironmentOutlined style={{ marginRight: '6px', color: '#1890ff', fontSize: '14px' }} />
                                    <span style={{
                                        maxWidth: '350px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: 'inline-block'
                                    }}>
                                        {event.location}
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div style={{ flexShrink: 0 }}>
                            <Button
                                type="primary"
                                size="middle"
                                style={{
                                    padding: '0 24px',
                                    height: '40px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 10px rgba(24, 144, 255, 0.3)'
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
