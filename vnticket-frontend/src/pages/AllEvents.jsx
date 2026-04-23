import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Row, Col, Typography, Input, message, Skeleton, Empty, Select, Pagination, Grid } from 'antd';
import { useTranslation } from 'react-i18next';
import axiosClient from '../api/axiosClient';
import FeaturedEventCard from '../components/FeaturedEventCard';
import EventSearchAutocomplete from '../components/EventSearchAutocomplete';
import { CalendarOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const AllEvents = () => {
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [eventType, setEventType] = useState(searchParams.get('type') || '');
    const { t } = useTranslation();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    
    // Đồng bộ state khi URL parameters thay đổi
    useEffect(() => {
        setSearchTerm(searchParams.get('search') || '');
        setEventType(searchParams.get('type') || '');
    }, [searchParams]);

    // Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // Reset về trang 1 khi đổi bộ lọc
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, eventType]);

    // Sử dụng React-Query tự động Caching cho Phân Trang
    const { data, isLoading: loading, isError } = useQuery({
        queryKey: ['allEvents', currentPage, pageSize, searchTerm, eventType],
        queryFn: async () => {
            let url = `/events?page=${currentPage - 1}&size=${pageSize}`;
            if (searchTerm) url += `&search=${searchTerm}`;
            if (eventType) url += `&type=${eventType}`;
            const response = await axiosClient.get(url);
            return response.data;
        }
    });

    if (isError) {
        message.error(t('allEvents.loadError'));
    }

    const events = data?.content || [];
    const totalElements = data?.totalElements || 0;

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        if (size !== pageSize) {
            setPageSize(size);
            setCurrentPage(1);
        }
    };

    return (
        <div style={{ padding: isMobile ? '0 16px' : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                <Title level={2} style={{ margin: 0 }}>
                    <CalendarOutlined style={{ color: '#1890ff', marginRight: '8px' }} /> {t('allEvents.title')}
                </Title>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                    <Select
                        placeholder={t('allEvents.categoryPlaceholder')}
                        style={{ width: '100%', maxWidth: '200px', flex: '1 1 150px' }}
                        allowClear
                        value={eventType || undefined}
                        onChange={setEventType}
                        size={"large"}
                    >
                        <Option value="Âm Nhạc">{t('allEvents.musicConcert')}</Option>
                        <Option value="Thể Thao">{t('allEvents.sports')}</Option>
                        <Option value="Hội Thảo">{t('allEvents.conference')}</Option>
                        <Option value="Tham quan, Trải nghiệm">{t('home.experience', 'Tham quan, Trải nghiệm')}</Option>
                        <Option value="Sân khấu, Nghệ thuật">{t('home.art', 'Sân khấu, Nghệ thuật')}</Option>
                        <Option value="Khác">{t('allEvents.other')}</Option>
                    </Select>

                    <EventSearchAutocomplete
                        placeholder={t('allEvents.searchPlaceholder')}
                        defaultValue={searchTerm}
                        onSearch={setSearchTerm}
                        style={{ maxWidth: '300px', flex: '1 1 200px' }}
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
