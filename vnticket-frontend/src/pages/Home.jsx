import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Typography, Input, message, Skeleton, Empty, Carousel, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';
import EventCard from '../components/EventCard';
import FeaturedEventCard from '../components/FeaturedEventCard';
import HeroSlide from '../components/HeroSlide';
import { FireOutlined, RightOutlined, LeftOutlined, HeartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

const { Title } = Typography;
const { Search } = Input;

const Home = () => {
    const [events, setEvents] = useState([]);
    const [sliderEvents, setSliderEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sliderLoading, setSliderLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventType, setEventType] = useState('');
    const navigate = useNavigate();
    const scrollContainerRef = React.useRef(null);
    const { t } = useTranslation();
    const { isDark } = useContext(ThemeContext);

    const categories = [
        { label: t('home.all'), value: '' },
        { label: t('home.music'), value: 'Âm Nhạc' },
        { label: t('home.sports'), value: 'Thể Thao' },
        { label: t('home.conference'), value: 'Hội Thảo' },
        { label: t('home.experience'), value: 'Tham quan, Trải nghiệm' },
        { label: t('home.art'), value: 'Sân khấu, Nghệ thuật' },
        { label: t('home.other'), value: 'Khác' },
    ];

    const scroll = (scrollOffset) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
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
                    // Cuộn sang phải 1 ô (320px)
                    scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                }
            }
        }, 3000); // 3 giây trượt 1 lần

        return () => clearInterval(interval); // Cleanup khi component unmount
    }, [events]);

    useEffect(() => {
        fetchEvents();
    }, [searchTerm, eventType]);

    useEffect(() => {
        const fetchSliderEvents = async () => {
            try {
                const res = await axiosClient.get('/events?size=100');
                const content = res.data.content || [];
                setSliderEvents(content.filter(e => e.isSlider));
            } catch (err) {
                console.error("Failed to load slider events:", err);
            } finally {
                setSliderLoading(false);
            }
        };
        fetchSliderEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let url = `/events?size=20`;
            if (searchTerm) url += `&search=${searchTerm}`;
            if (eventType) url += `&type=${eventType}`;

            const response = await axiosClient.get(url);
            setEvents(response.data.content); // Spring Page structure
        } catch (error) {
            message.error(t('home.loadError'));
        } finally {
            setLoading(false);
        }
    };

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

            {/* Danh mục lướt nhanh & Tìm kiếm */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div
                    className="hide-scrollbar"
                    style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        flex: '1 1 auto',
                        paddingBottom: '5px'
                    }}
                >
                    {categories.map(cat => {
                        const isSelected = eventType === cat.value;
                        return (
                            <Button
                                key={cat.value}
                                type={isSelected ? 'primary' : 'default'}
                                shape="round"
                                onClick={() => setEventType(cat.value)}
                                size="large"
                                style={{
                                    minWidth: '100px',
                                    fontWeight: '600',
                                    border: isSelected ? 'none' : `1px solid ${isDark ? '#434343' : '#d9d9d9'}`,
                                    backgroundColor: isSelected ? '#1890ff' : (isDark ? '#303030' : 'white'),
                                    color: isSelected ? 'white' : (isDark ? '#d9d9d9' : '#595959'),
                                    boxShadow: isSelected ? '0 4px 12px rgba(24, 144, 255, 0.3)' : 'none'
                                }}
                            >
                                {cat.label}
                            </Button>
                        );
                    })}
                </div>

                <Search
                    placeholder={t('home.searchPlaceholder')}
                    allowClear
                    onSearch={setSearchTerm}
                    style={{ width: '100%', maxWidth: '350px', flex: '0 0 auto' }}
                    size="large"
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
                        <Title level={2} style={{ margin: 0, color: isDark ? '#e8e8e8' : '#1f1f1f' }}>
                            <FireOutlined style={{ color: '#eb2f96', marginRight: '8px' }} /> {t('home.featuredEvents')}
                        </Title>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                            <Button
                                shape="circle"
                                icon={<LeftOutlined />}
                                onClick={() => scroll(-320)}
                                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}
                            />
                            <Button
                                shape="circle"
                                icon={<RightOutlined />}
                                onClick={() => scroll(320)}
                                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}
                            />
                        </div>
                    </div>
                    {events.filter(e => e.isFeatured).length > 4 && (
                        <Button
                            type="link"
                            style={{ color: '#1890ff', fontSize: '15px', display: 'flex', alignItems: 'center' }}
                            onClick={() => navigate('/events')}
                        >
                            {t('home.viewAll')}
                            <RightOutlined style={{ marginLeft: '4px' }} />
                        </Button>
                    )}
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
                            gap: '24px',
                            paddingBottom: '16px',
                            scrollSnapType: 'x mandatory',
                            scrollbarWidth: 'none',   // Firefox
                            msOverflowStyle: 'none',  // IE
                            scrollBehavior: 'smooth'
                        }}
                    >
                        {events.filter(e => e.isFeatured).map(event => (
                            <div key={event.id} style={{ minWidth: '280px', maxWidth: '300px', flex: '0 0 auto', scrollSnapAlign: 'start' }}>
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
                    <Title level={2} style={{ margin: 0, color: isDark ? '#e8e8e8' : '#1f1f1f' }}>
                        <HeartOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} /> {t('home.forYou')}
                    </Title>
                </div>

                {loading ? (
                    <Row gutter={[24, 24]}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <Col xs={24} sm={12} md={8} lg={6} key={i}>
                                <Skeleton active avatar={{ shape: 'square', size: 200 }} paragraph={{ rows: 3 }} />
                            </Col>
                        ))}
                    </Row>
                ) : events.filter(e => !e.isSlider && !e.isFeatured).length > 0 ? (
                    <>
                        <Row gutter={[24, 24]}>
                            {events.filter(e => !e.isSlider && !e.isFeatured).slice(0, 8).map((event) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
                                    <FeaturedEventCard event={event} />
                                </Col>
                            ))}
                        </Row>
                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <Button
                                type="primary"
                                ghost
                                size="large"
                                onClick={() => navigate('/events')}
                                style={{ borderRadius: '100px', padding: '0 40px', height: '50px', fontWeight: 'bold' }}
                            >
                                {t('home.exploreMore')}
                            </Button>
                        </div>
                    </>
                ) : (
                    <Empty description={<span style={{ color: '#888' }}>{t('home.notEnoughEvents')}</span>} style={{ margin: '50px 0' }} />
                )}
            </div>
        </div>
    );
};

export default Home;
