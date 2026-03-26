import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { Dropdown } from 'antd';
import { DownOutlined, CheckOutlined } from '@ant-design/icons';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const { isDark } = useContext(ThemeContext);
    const currentLang = i18n.language || 'vi';

    const handleLanguageChange = ({ key }) => {
        i18n.changeLanguage(key);
        localStorage.setItem('language', key);
    };

    const languages = [
        {
            key: 'vi',
            label: 'Tiếng Việt (VN)',
            flag: 'https://flagcdn.com/w40/vn.png',
            code: 'VN'
        },
        {
            key: 'en',
            label: 'English (EN)',
            flag: 'https://flagcdn.com/w40/gb.png',
            code: 'EN'
        }
    ];

    const currentLanguageObj = languages.find(l => l.key === currentLang) || languages[0];

    const items = languages.map(lang => ({
        key: lang.key,
        label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '150px', padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                        src={lang.flag} 
                        alt={lang.code} 
                        style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: isDark ? '1px solid #434343' : '1px solid #f0f0f0' }} 
                    />
                    <span style={{ fontWeight: currentLang === lang.key ? 600 : 400, color: isDark && currentLang === lang.key ? '#fff' : undefined }}>
                        {lang.label}
                    </span>
                </div>
                {currentLang === lang.key && <CheckOutlined style={{ color: '#1890ff', fontSize: '16px' }} />}
            </div>
        )
    }));

    return (
        <Dropdown menu={{ items, onClick: handleLanguageChange }} trigger={['click']} placement="bottomRight">
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    userSelect: 'none',
                    color: isDark ? '#e8e8e8' : '#1f1f1f',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                <img 
                    src={currentLanguageObj.flag} 
                    alt={currentLanguageObj.code} 
                    style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }} 
                />
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{currentLanguageObj.code}</span>
                <DownOutlined style={{ fontSize: '12px', color: '#8c8c8c', strokeWidth: 20 }} />
            </div>
        </Dropdown>
    );
};

export default LanguageSwitcher;
