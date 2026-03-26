import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Input, message, Skeleton, Empty, Select, Pagination } from 'antd';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';
import FeaturedEventCard from '../components/FeaturedEventCard';
import { CalendarOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const AllEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventType, setEventType] = useState('');
    const { t } = useTranslation();
    
    // Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [totalElements, setTotalElements] = useState(0);

    useEffect(() => {
        fetchEvents(currentPage, pageSize);
    }, [searchTerm, eventType, currentPage, pageSize]);

    // Reset về trang 1 khi đổi bộ lọc
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, eventType]);

    const fetchEvents = async (page, size) => {
        setLoading(true);
        try {
            // Spring Boot pagination is 0-indexed
            let url = `/events?page=${page - 1}&size=${size}`;
            if (searchTerm) url += `&search=${searchTerm}`;
            if (eventType) url += `&type=${eventType}`;

            const response = await axiosClient.get(url);
            setEvents(response.data.content);
            setTotalElements(response.data.totalElements);
        } catch (error) {
            message.error(t('allEvents.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        if (size !== pageSize) {
            setPageSize(size);
            setCurrentPage(1);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                <Title level={2} style={{ margin: 0 }}>
                    <CalendarOutlined style={{ color: '#1890ff', marginRight: '8px' }} /> {t('allEvents.title')}
                </Title>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                    <Select
                        placeholder={t('allEvents.categoryPlaceholder')}
                        style={{ width: '100%', maxWidth: '200px', flex: '1 1 150px' }}
                        allowClear
                        onChange={setEventType}
                        size={"large"}
                    >
                        <Option value="Âm Nhạc">{t('allEvents.musicConcert')}</Option>
                        <Option value="Thể Thao">{t('allEvents.football')}</Option>
                        <Option value="Hội Thảo">{t('allEvents.conference')}</Option>
                        <Option value="Khác">{t('allEvents.other')}</Option>
                    </Select>

                    <Search
                        placeholder={t('allEvents.searchPlaceholder')}
                        allowClear
                        onSearch={setSearchTerm}
                        style={{ width: '100%', maxWidth: '300px', flex: '1 1 200px' }}
                        size={"large"}
                    />
                </div>
            </div>

            {loading ? (
                <Row gutter={[24, 24]}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <Col xs={24} sm={12} md={8} lg={6} key={i}>
                            <Skeleton active avatar={{ shape: 'square', size: 200 }} paragraph={{ rows: 3 }} />
                        </Col>
                    ))}
                </Row>
            ) : events.length > 0 ? (
                <>
                    <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                        {events.map((event) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
                                <FeaturedEventCard event={event} />
                            </Col>
                        ))}
                    </Row>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        <Pagination 
                            current={currentPage} 
                            pageSize={pageSize} 
                            total={totalElements} 
                            onChange={handlePageChange}
                            showSizeChanger
                            showTotal={(total) => t('allEvents.total', { total })}
                        />
                    </div>
                </>
            ) : (
                <Empty description={t('allEvents.noEvents')} style={{ margin: '50px 0' }} />
            )}
        </div>
    );
};

export default AllEvents;
