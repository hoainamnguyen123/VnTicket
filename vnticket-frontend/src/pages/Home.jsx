import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Input, message, Skeleton, Empty, Carousel, Button } from 'antd';
import axiosClient from '../api/axiosClient';
import EventCard from '../components/EventCard';
import FeaturedEventCard from '../components/FeaturedEventCard';
import HeroSlide from '../components/HeroSlide';
import { FireOutlined, RightOutlined, LeftOutlined, HeartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Search } = Input;

const Home = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventType, setEventType] = useState('');
    const navigate = useNavigate();
    const scrollContainerRef = React.useRef(null);

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

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let url = `/events?size=100`; // Fetch more to ensure we get slider/featured ones
            if (searchTerm) url += `&search=${searchTerm}`;
            if (eventType) url += `&type=${eventType}`;

            const response = await axiosClient.get(url);
            setEvents(response.data.content); // Spring Page structure
        } catch (error) {
            message.error('Không thể tải danh sách sự kiện!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Banner/Carousel Động */}
            {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} style={{ height: '400px', marginBottom: 40 }} />
            ) : events.filter(e => e.isSlider).length > 0 ? (
                <Carousel autoplay effect="fade" style={{ marginBottom: 40, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    {events.filter(e => e.isSlider).slice(0, 5).map(event => (
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
                    {['Tất cả', 'Âm Nhạc', 'Thể Thao', 'Hội Thảo', 'Tham quan, Trải nghiệm', 'Sân khấu, Nghệ thuật', 'Khác'].map(cat => {
                        const val = cat === 'Tất cả' ? '' : cat;
                        const isSelected = eventType === val;
                        return (
                            <Button 
                                key={cat}
                                type={isSelected ? 'primary' : 'default'}
                                shape="round"
                                onClick={() => setEventType(val)}
                                size="large"
                                style={{ 
                                    minWidth: '100px', 
                                    fontWeight: '600', 
                                    border: isSelected ? 'none' : '1px solid #d9d9d9',
                                    backgroundColor: isSelected ? '#1890ff' : 'white',
                                    color: isSelected ? 'white' : '#595959',
                                    boxShadow: isSelected ? '0 4px 12px rgba(24, 144, 255, 0.3)' : 'none'
                                }}
                            >
                                {cat}
                            </Button>
                        );
                    })}
                </div>

                <Search
                    placeholder="Tìm kiếm sự kiện..."
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
                        <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
                            <FireOutlined style={{ color: '#eb2f96', marginRight: '8px' }} /> Sự kiện nổi bật
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
                            Xem tất cả 
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
                    <Empty description={<span style={{ color: '#888' }}>Không có sự kiện nổi bật nào</span>} style={{ margin: '50px 0' }} />
                )}
            </div>

            {/* Có thể bạn sẽ thích (For You) */}
            <div style={{ padding: '0 10px', marginTop: '60px', marginBottom: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
                        <HeartOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} /> Dành cho bạn
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
                                Khám phá thêm hàng trăm sự kiện khác
                            </Button>
                        </div>
                    </>
                ) : (
                    <Empty description={<span style={{ color: '#888' }}>Chưa có đủ sự kiện để gợi ý lúc này</span>} style={{ margin: '50px 0' }} />
                )}
            </div>
        </div>
    );
};

export default Home;
