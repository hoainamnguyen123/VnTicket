import React, { useState, useEffect, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Typography, Input, message, Skeleton, Empty, Carousel, Button, Select, Grid } from 'antd';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';
import EventCard from '../components/EventCard';
import FeaturedEventCard from '../components/FeaturedEventCard';
import HeroSlide from '../components/HeroSlide';
import EventSearchAutocomplete from '../components/EventSearchAutocomplete';
import { 
    FireOutlined, RightOutlined, LeftOutlined, HeartOutlined, 
    AppstoreOutlined, TrophyOutlined, TeamOutlined, CompassOutlined, 
    PictureOutlined, EllipsisOutlined, CustomerServiceOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

const { Title, Text } = Typography;

const MobileCategoryItem = ({ label, value, icon, isSelected, onClick, isDark }) => (
    <div 
        onClick={() => onClick(value)}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            width: '24%', // ~4 columns
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        }}
    >
        <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '16px',
            background: isSelected 
                ? 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)' 
                : (isDark ? '#303030' : '#f0f2f5'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: isSelected ? '#fff' : (isDark ? '#d9d9d9' : '#595959'),
            boxShadow: isSelected ? '0 4px 12px rgba(24, 144, 255, 0.3)' : 'none',
            border: isSelected ? 'none' : `1px solid ${isDark ? '#434343' : 'transparent'}`,
        }}>
            {icon}
        </div>
        <Text style={{ 
            fontSize: '11px', 
            fontWeight: isSelected ? '700' : '500',
            color: isSelected ? (isDark ? '#fff' : '#1890ff') : (isDark ? '#a0a0a0' : '#595959'),
            textAlign: 'center',
            lineHeight: '1.2',
            maxWidth: '100%'
        }}>
            {label}
        </Text>
    </div>
);

const Home = () => {
    const navigate = useNavigate();
    const scrollContainerRef = React.useRef(null);
    const locationScrollRef = React.useRef(null);
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.lg; // Chuyển sang lg (992px) để bao quát cả iPad/Tablet

    const categories = [
        { label: t('home.all'), value: '', icon: <AppstoreOutlined /> },
        { label: t('home.music'), value: 'Âm Nhạc', icon: <CustomerServiceOutlined /> },
        { label: t('home.sports'), value: 'Thể Thao', icon: <TrophyOutlined /> },
        { label: t('home.conference'), value: 'Hội Thảo', icon: <TeamOutlined /> },
        { label: t('home.experience'), value: 'Tham quan, Trải nghiệm', icon: <CompassOutlined /> },
        { label: t('home.art'), value: 'Sân khấu, Nghệ thuật', icon: <PictureOutlined /> },
        { label: t('home.other'), value: 'Khác', icon: <EllipsisOutlined /> },
    ];

    // GIẢI QUYẾT TRẮNG TRANG: Đưa 2 cái useQuery này LÊN TRƯỚC useEffect để không bị Reference Error!
    // Sử dụng React-Query tự động Caching Banner (Slider)
    const { data: sliderEvents = [], isLoading: sliderLoading } = useQuery({
        queryKey: ['sliderEvents'],
        queryFn: async () => {
            const res = await axiosClient.get('/events?size=100');
            const content = res.data.content || [];
            return content.filter(e => e.isSlider);
        }
    });

    // Sử dụng React-Query tự động Caching Sự kiện cho Trang chủ (Fixed Featured/New)
    const { data: events = [], isLoading: loading } = useQuery({
        queryKey: ['events', 'home'],
        queryFn: async () => {
            const response = await axiosClient.get(`/events?size=40`);
            return response.data.content;
        }
    });

    // Logic đề xuất "Dành cho bạn": Ưu tiên tương lai + Trộn ngẫu nhiên (Shuffle)
    const recommendedEvents = React.useMemo(() => {
        if (!events || events.length === 0) return [];
        
        const nowVal = new Date();
        return [...events]
            .filter(e => !e.isSlider && !e.isFeatured)
            .sort((a, b) => {
                const aIsFuture = new Date(a.startTime) >= nowVal;
                const bIsFuture = new Date(b.startTime) >= nowVal;

                if (aIsFuture && !bIsFuture) return -1;
                if (!aIsFuture && bIsFuture) return 1;
                
                // Nếu cùng trạng thái, trộn ngẫu nhiên để tạo sự tươi mới
                return Math.random() - 0.5;
            })
            .slice(0, 8);
    }, [events]);

    const scroll = (scrollOffset, ref = scrollContainerRef) => {
        if (ref.current) {
            ref.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
        }
    };

    // Auto-scroll logic
    useEffect(() => {
        if (!events || events.length === 0) return;

        const interval = setInterval(() => {
            if (scrollContainerRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

                // Nếu đã cuộn đến cuối hoặc gần cuối (sai số 50px)
                if (scrollLeft + clientWidth >= scrollWidth - 50) {
                    // Quay lại đầu
                    scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    // Cuộn sang phải 1 hoặc 2 ô tùy màn hình
                    const scrollAmount = isMobile ? (clientWidth / 2 + 6) : 320;
                    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }
        }, 4000); // 4 giây trượt 1 lần (tăng lên chút cho dễ đọc)

        return () => clearInterval(interval); // Cleanup khi component unmount
    }, [events, isMobile]);

    // Tự động cuộn cho phần địa điểm
    useEffect(() => {
        const interval = setInterval(() => {
            if (locationScrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = locationScrollRef.current;

                if (scrollLeft + clientWidth >= scrollWidth - 20) {
                    locationScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    // Trượt 1 ô (trên mobile là nửa màn hình + gap)
                    const scrollAmount = isMobile ? (clientWidth / 2 + 6) : 240;
                    locationScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }
        }, 5000); // Trượt chậm hơn một chút so với phần trên

        return () => clearInterval(interval);
    }, [isMobile]);

    return (
        <div>
            {/* Banner/Carousel Động */}
            {sliderLoading ? (
                <Skeleton active paragraph={{ rows: 6 }} style={{ height: '400px', marginBottom: 40 }} />
            ) : sliderEvents.length > 0 ? (
                <Carousel autoplay effect="fade" style={{ marginBottom: 40, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    {sliderEvents.slice(0, 5).map(event => (
                        <div key={event.id}>
                            <HeroSlide event={event} />
                        </div>
                    ))}
                </Carousel>
            ) : null}

            {/* Danh mục (Chỉ PC) & Tìm kiếm */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px', padding: isMobile ? '0 10px' : 0 }}>
                {!isMobile && (
                    <div
                        className="hide-scrollbar"
                        style={{
                            display: 'flex',
                            gap: '12px',
                            overflowX: 'auto',
                            flex: '1 1 auto',
                            padding: '10px 0'
                        }}
                    >
                        {categories.map(cat => (
                            <Button
                                key={cat.value}
                                type="default"
                                shape="round"
                                onClick={() => navigate(`/events?type=${encodeURIComponent(cat.value)}`)}
                                size="large"
                                style={{
                                    minWidth: '120px',
                                    height: '45px',
                                    fontWeight: '600',
                                    border: `1px solid ${isDark ? '#434343' : '#d9d9d9'}`,
                                    backgroundColor: (isDark ? '#303030' : 'white'),
                                    color: (isDark ? '#d9d9d9' : '#595959'),
                                }}
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </div>
                )}
                
                <EventSearchAutocomplete
                    placeholder={t('home.searchPlaceholder')}
                    onSearch={(val) => navigate(`/events?search=${encodeURIComponent(val)}`)}
                    style={{ 
                        width: '100%', 
                        maxWidth: isMobile ? '100%' : '350px', 
                        margin: isMobile ? '0' : '0' 
                    }}
                />
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {/* Khung sự kiện nổi bật (Nền trắng) */}
            <div style={{ padding: '0 10px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Title level={2} style={{ 
                            margin: 0, 
                            color: isDark ? '#e8e8e8' : '#1f1f1f',
                            fontSize: isMobile ? '20px' : undefined 
                        }}>
                            <FireOutlined style={{ color: '#eb2f96', marginRight: '8px' }} /> {t('home.featuredEvents')}
                        </Title>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                            <Button
                                shape="circle"
                                icon={<LeftOutlined />}
                                onClick={() => scroll(isMobile ? -(scrollContainerRef.current?.clientWidth / 2 + 6) : -320)}
                                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}
                            />
                            <Button
                                shape="circle"
                                icon={<RightOutlined />}
                                onClick={() => scroll(isMobile ? (scrollContainerRef.current?.clientWidth / 2 + 6) : 320)}
                                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <Row gutter={[24, 24]}>
                        {[1, 2, 3, 4].map(i => (
                            <Col xs={24} sm={12} md={8} lg={6} key={i}>
                                <Skeleton active avatar={{ shape: 'square', size: 200 }} paragraph={{ rows: 3 }} />
                            </Col>
                        ))}
                    </Row>
                ) : events.filter(e => e.isFeatured).length > 0 ? (
                    <div
                        ref={scrollContainerRef}
                        className="hide-scrollbar"
                        style={{
                            display: 'flex',
                            overflowX: 'auto',
                            gap: isMobile ? '12px' : '24px',
                            paddingBottom: '16px',
                            scrollSnapType: 'x mandatory',
                            scrollbarWidth: 'none',   // Firefox
                            msOverflowStyle: 'none',  // IE
                            scrollBehavior: 'smooth'
                        }}
                    >
                        {events.filter(e => e.isFeatured).map(event => (
                            <div 
                                key={event.id} 
                                style={{ 
                                    minWidth: isMobile ? 'calc(50% - 6px)' : '280px', 
                                    maxWidth: isMobile ? 'calc(50% - 6px)' : '300px', 
                                    flex: '0 0 auto', 
                                    scrollSnapAlign: 'start' 
                                }}
                            >
                                <FeaturedEventCard event={event} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty description={<span style={{ color: '#888' }}>{t('home.noFeaturedEvents')}</span>} style={{ margin: '50px 0' }} />
                )}
            </div>

            {/* Có thể bạn sẽ thích (For You) */}
            <div style={{ padding: '0 10px', marginTop: '60px', marginBottom: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Title level={2} style={{ 
                        margin: 0, 
                        color: isDark ? '#e8e8e8' : '#1f1f1f',
                        fontSize: isMobile ? '20px' : undefined
                    }}>
                        <HeartOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} /> {t('home.forYou')}
                    </Title>
                </div>

                {loading ? (
                    <Row gutter={isMobile ? [12, 12] : [24, 24]}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <Col xs={12} sm={12} md={8} lg={6} key={i}>
                                <Skeleton active avatar={{ shape: 'square', size: 120 }} paragraph={{ rows: 2 }} />
                            </Col>
                        ))}
                    </Row>
                ) : recommendedEvents.length > 0 ? (
                    <>
                        <Row gutter={isMobile ? [12, 12] : [24, 24]}>
                            {recommendedEvents.map((event) => (
                                <Col xs={12} sm={12} md={8} lg={6} key={event.id}>
                                    <FeaturedEventCard event={event} />
                                </Col>
                            ))}
                        </Row>
                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <Button
                                type="primary"
                                ghost
                                size={isMobile ? 'middle' : 'large'}
                                onClick={() => navigate('/events')}
                                style={{
                                    borderRadius: '100px',
                                    padding: isMobile ? '0 12px' : '0 40px',
                                    height: isMobile ? '40px' : '50px',
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '13px' : '16px',
                                    width: isMobile ? 'calc(100% - 32px)' : 'auto',
                                    maxWidth: '400px'
                                }}
                            >
                                {t('home.exploreMore')}
                            </Button>
                        </div>
                    </>
                ) : (
                    <Empty description={<span style={{ color: '#888' }}>{t('home.notEnoughEvents')}</span>} style={{ margin: '50px 0' }} />
                )}
            </div>

            {/* Khám phá theo địa điểm */}
            <div style={{ padding: '0 10px', marginTop: '40px', marginBottom: '60px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <Title level={2} style={{ 
                            margin: 0, 
                            color: isDark ? '#e8e8e8' : '#1f1f1f',
                            fontSize: isMobile ? '20px' : undefined
                        }}>
                            <CompassOutlined style={{ color: '#1890ff', marginRight: '8px' }} /> {t('home.exploreByLocation', 'Khám phá theo địa điểm')}
                        </Title>
                        {!isMobile && (
                            <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                                <Button
                                    shape="circle"
                                    icon={<LeftOutlined />}
                                    onClick={() => scroll(-240, locationScrollRef)}
                                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}
                                />
                                <Button
                                    shape="circle"
                                    icon={<RightOutlined />}
                                    onClick={() => scroll(240, locationScrollRef)}
                                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}
                                />
                            </div>
                        )}
                    </div>

                <div 
                    ref={locationScrollRef}
                    className="hide-scrollbar"
                    style={{ 
                        display: 'flex', 
                        gap: isMobile ? '12px' : '20px', 
                        overflowX: 'auto', 
                        paddingBottom: '20px',
                        scrollBehavior: 'smooth'
                    }}
                >
                    {[
                        { name: 'Hà Nội', value: 'Hà Nội', image: '/images/locations/hanoi.png' },
                        { name: 'TP. Hồ Chí Minh', value: 'Hồ Chí Minh', image: '/images/locations/hcmc.png' },
                        { name: 'Đà Nẵng', value: 'Đà Nẵng', image: '/images/locations/danang.png' },
                        { name: 'Khác', value: 'others', image: '/images/locations/other.png' },
                    ].map((loc, idx) => (
                        <div 
                            key={idx}
                            onClick={() => navigate(`/events?location=${encodeURIComponent(loc.value)}`)}
                            style={{ 
                                minWidth: isMobile ? '140px' : '220px', 
                                height: isMobile ? '180px' : '280px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                flex: '0 0 auto',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}
                        >
                            <img 
                                src={loc.image} 
                                alt={loc.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            />
                            <div style={{ 
                                position: 'absolute', 
                                bottom: 0, left: 0, right: 0, 
                                padding: '20px 12px',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                                color: 'white'
                            }}>
                                <Text strong style={{ color: 'white', fontSize: isMobile ? '14px' : '18px' }}>{loc.name}</Text>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Danh mục (Chỉ hiển thị ở cuối trên Mobile) */}
            {isMobile && (
                <div style={{ padding: '0 10px', marginTop: '40px', marginBottom: '80px' }}>
                    <Title level={2} style={{ 
                        marginBottom: '24px', 
                        color: isDark ? '#e8e8e8' : '#1f1f1f',
                        fontSize: isMobile ? '20px' : undefined
                    }}>
                        <AppstoreOutlined style={{ marginRight: '8px', color: '#1890ff' }} /> {t('home.exploreByGenre', 'Khám phá theo thể loại')}
                    </Title>
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        rowGap: '20px', 
                        columnGap: '1%',
                        background: isDark ? 'rgba(31, 31, 31, 0.5)' : '#fff',
                        padding: '20px 10px',
                        borderRadius: '20px',
                        boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.04)',
                    }}>
                        {categories.map(cat => (
                            <MobileCategoryItem 
                                key={cat.value}
                                label={cat.label}
                                value={cat.value}
                                icon={cat.icon}
                                isSelected={false}
                                onClick={(val) => navigate(`/events?type=${encodeURIComponent(val)}`)}
                                isDark={isDark}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
