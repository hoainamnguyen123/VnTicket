import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Input, message, Skeleton, Empty, Select, Carousel } from 'antd';
import axiosClient from '../api/axiosClient';
import EventCard from '../components/EventCard';
import { FireOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Home = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventType, setEventType] = useState('');

    useEffect(() => {
        fetchEvents();
    }, [searchTerm, eventType]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let url = `/events?size=20`;
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
            {/* Banner/Carousel */}
            <Carousel autoplay style={{ marginBottom: 40, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ height: 'clamp(200px, 40vw, 400px)' }}>
                    <img src="https://salt.tkbcdn.com/ts/ds/c4/a7/1d/cfbdf10c12bde531280b5120d3508d40.png" alt="Banner 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ height: 'clamp(200px, 40vw, 400px)' }}>
                    <img src="https://salt.tkbcdn.com/ts/ds/74/ca/18/173014220d7b30fb44d26955187b13e9.png" alt="Banner 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            </Carousel>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                <Title level={2} style={{ margin: 0 }}><FireOutlined style={{ color: '#eb2f96' }} /> Sự kiện nổi bật</Title>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                    <Select
                        placeholder="Thể loại"
                        style={{ width: '100%', maxWidth: '200px', flex: '1 1 150px' }}
                        allowClear
                        onChange={setEventType}
                        size={"large"}
                    >
                        <Option value="Âm Nhạc">Âm nhạc / Concert</Option>
                        <Option value="Thể Thao">Bóng đá</Option>
                        <Option value="Hội Thảo">Hội Thảo</Option>
                        <Option value="Khác">Khác</Option>
                    </Select>

                    <Search
                        placeholder="Tìm kiếm sự kiện..."
                        allowClear
                        onSearch={setSearchTerm}
                        style={{ width: '100%', maxWidth: '300px', flex: '1 1 200px' }}
                        size={"large"}
                    />
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
            ) : events.length > 0 ? (
                <Row gutter={[24, 24]}>
                    {events.map((event) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
                            <EventCard event={event} />
                        </Col>
                    ))}
                </Row>
            ) : (
                <Empty description="Không tìm thấy sự kiện nào" style={{ margin: '50px 0' }} />
            )}
        </div>
    );
};

export default Home;
