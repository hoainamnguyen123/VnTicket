import React, { useState, useContext, useCallback, useRef } from 'react';
import { AutoComplete, Input, Typography, Tag } from 'antd';
import { SearchOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import axiosClient from '../api/axiosClient';
import { formatCurrency } from '../utils/formatters';

const { Text } = Typography;

const EVENT_TYPE_ICONS = {
    'Âm Nhạc': '🎵',
    'Thể Thao': '⚽',
    'Hội Thảo': '📋',
    'Tham quan, Trải nghiệm': '🎡',
    'Sân khấu, Nghệ thuật': '🎭',
    'Khác': '📌',
};

const EventSearchAutocomplete = ({ placeholder, onSearch, size = 'large', style = {} }) => {
    const [options, setOptions] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { isDark } = useContext(ThemeContext);
    const { t } = useTranslation();
    const debounceTimer = useRef(null);

    const fetchSuggestions = useCallback(async (query) => {
        if (!query || query.trim().length < 2) {
            setOptions([]);
            return;
        }

        setLoading(true);
        try {
            const response = await axiosClient.get(`/events?search=${query}&size=6`);
            const events = response.data.content || [];

            const suggestions = events.map(event => ({
                value: event.name,
                key: event.id,
                label: (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '6px 0',
                        }}
                    >
                        {/* Thumbnail */}
                        <img
                            src={event.imageUrl || '/placeholder.png'}
                            alt=""
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                flexShrink: 0,
                            }}
                        />

                        {/* Event info */}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '14px' }}>
                                    {EVENT_TYPE_ICONS[event.eventType] || '📌'}
                                </span>
                                <Text
                                    strong
                                    style={{
                                        fontSize: '14px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {event.name}
                                </Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                {event.ticketTypes?.length > 0 && (
                                    <Text type="danger" style={{ fontSize: '12px', fontWeight: 600 }}>
                                        {t('common.from')} {formatCurrency(Math.min(...event.ticketTypes.map(tt => tt.price)))}
                                    </Text>
                                )}
                                {event.location && (
                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                        <EnvironmentOutlined /> {event.location.length > 20 ? event.location.substring(0, 20) + '...' : event.location}
                                    </Text>
                                )}
                            </div>
                        </div>
                    </div>
                ),
                event: event,
            }));

            setOptions(suggestions);
        } catch (error) {
            console.error('Search suggestions error:', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    const handleSearch = (value) => {
        setSearchValue(value);

        // Debounce 300ms
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 300);
    };

    const handleSelect = (value, option) => {
        if (option.event) {
            navigate(`/event/${option.event.id}`);
        }
    };

    const handlePressEnter = () => {
        if (onSearch) {
            onSearch(searchValue);
        }
        setOptions([]);
    };

    return (
        <>
            <style>{`
                .event-search-dropdown .ant-select-item-option-active {
                    background: ${isDark ? '#303030' : '#f0f0ff'} !important;
                }
                .event-search-dropdown .ant-select-item {
                    padding: 4px 12px !important;
                }
            `}</style>
            <AutoComplete
                options={options}
                onSearch={handleSearch}
                onSelect={handleSelect}
                style={{ width: '100%', ...style }}
                popupClassName="event-search-dropdown"
                value={searchValue}
                onChange={setSearchValue}
            >
                <Input
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder={placeholder}
                    size={size}
                    allowClear
                    onPressEnter={handlePressEnter}
                    style={{ borderRadius: '8px' }}
                    suffix={loading ? <span style={{ fontSize: '12px', color: '#bfbfbf' }}>...</span> : null}
                />
            </AutoComplete>
        </>
    );
};

export default EventSearchAutocomplete;
