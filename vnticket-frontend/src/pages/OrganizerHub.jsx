import React, { useContext } from 'react';
import { Typography, Button, Row, Col, Card, Grid, Collapse } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, RocketOutlined, DollarOutlined, SafetyCertificateOutlined, FireOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import MyEvents from './MyEvents';

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const OrganizerHub = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    return (
        <div style={{ padding: isMobile ? '0 16px' : '0' }}>
            {/* Hero Section */}
            <div style={{
                background: isDark ? 'linear-gradient(135deg, #1f1f1f 0%, #141414 100%)' : 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
                padding: isMobile ? '40px 20px' : '60px 40px',
                borderRadius: '16px',
                marginBottom: '40px',
                textAlign: 'center',
                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.05)'
            }}>
                <Title level={isMobile ? 2 : 1} style={{ marginBottom: '16px', fontWeight: 800 }}>
                    <RocketOutlined style={{ color: '#1890ff', marginRight: '12px' }} />
                    {t('organizerHub.welcome')}
                </Title>
                <Paragraph style={{ fontSize: '18px', color: isDark ? '#a6a6a6' : '#595959', maxWidth: '800px', margin: '0 auto 30px' }}>
                    {t('organizerHub.subtitle')}
                </Paragraph>
                
                {!user ? (
                    <div style={{ marginTop: '30px' }}>
                        <Paragraph style={{ fontSize: '16px', marginBottom: '20px' }}>
                            {t('organizerHub.loginPrompt')}
                        </Paragraph>
                        <Button type="primary" size="large" onClick={() => navigate('/login')} style={{ marginRight: '16px', borderRadius: '8px' }}>
                            {t('navbar.login')}
                        </Button>
                        <Button size="large" onClick={() => navigate('/register')} style={{ borderRadius: '8px' }}>
                            {t('navbar.register')}
                        </Button>
                    </div>
                ) : (
                    <div style={{ marginTop: '30px' }}>
                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<PlusOutlined />} 
                            onClick={() => navigate('/create-event')}
                            style={{ 
                                height: '50px', 
                                padding: '0 30px', 
                                fontSize: '16px', 
                                fontWeight: 600,
                                borderRadius: '25px',
                                boxShadow: '0 8px 20px rgba(24, 144, 255, 0.4)'
                            }}
                        >
                            {t('organizerHub.createEvent')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Contact Notice Section */}
            <div style={{
                background: isDark ? '#1d1d1d' : '#fffbe6',
                border: isDark ? '1px solid #303030' : '1px solid #ffe58f',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '40px',
                textAlign: 'center'
            }}>
                <Paragraph style={{ marginBottom: '8px', fontWeight: 500 }}>
                    {t('organizerHub.contactNotice')}
                </Paragraph>
                <Title level={5} style={{ margin: 0, color: '#faad14' }}>
                    {t('organizerHub.contactInfo')}
                </Title>
            </div>

            {/* Features Section (Show if not logged in or as a quick reminder) */}
            {!user && (
                <div style={{ marginBottom: '50px' }}>
                    <Title level={3} style={{ textAlign: 'center', marginBottom: '30px' }}>
                        {t('organizerHub.whyChooseUs')}
                    </Title>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={8}>
                            <Card bordered={false} style={{ textAlign: 'center', height: '100%', background: isDark ? '#1f1f1f' : '#fff' }}>
                                <DollarOutlined style={{ fontSize: '40px', color: '#52c41a', marginBottom: '16px' }} />
                                <Title level={4}>{t('organizerHub.reason1')}</Title>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card bordered={false} style={{ textAlign: 'center', height: '100%', background: isDark ? '#1f1f1f' : '#fff' }}>
                                <SafetyCertificateOutlined style={{ fontSize: '40px', color: '#1890ff', marginBottom: '16px' }} />
                                <Title level={4}>{t('organizerHub.reason2')}</Title>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card bordered={false} style={{ textAlign: 'center', height: '100%', background: isDark ? '#1f1f1f' : '#fff' }}>
                                <RocketOutlined style={{ fontSize: '40px', color: '#722ed1', marginBottom: '16px' }} />
                                <Title level={4}>{t('organizerHub.reason3')}</Title>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            {/* My Events Section - Render directly if logged in */}
            {user && (
                <div style={{ marginTop: '20px' }}>
                    <Title level={3} style={{ marginBottom: '24px' }}>
                        {t('organizerHub.manageEvents')}
                    </Title>
                    <MyEvents />
                </div>
            )}
            {/* Marketing Tools Section */}
            {user && (
                <div style={{ marginTop: '50px', marginBottom: '50px' }}>
                    <Title level={3} style={{ marginBottom: '24px' }}>
                        <FireOutlined style={{ color: '#ff4d4f', marginRight: '10px' }} />
                        {t('organizerHub.marketingTitle')}
                    </Title>
                    <Card 
                        hoverable
                        style={{ 
                            background: isDark ? 'linear-gradient(135deg, #2c1313 0%, #1a1a1a 100%)' : 'linear-gradient(135deg, #fff2f0 0%, #fff 100%)',
                            border: isDark ? '1px solid #5c2223' : '1px solid #ffccc7',
                            borderRadius: '16px'
                        }}
                        styles={{ body: { padding: isMobile ? '24px' : '32px' } }}
                    >
                        <Row align="middle" gutter={[24, 24]}>
                            <Col xs={24} lg={16}>
                                <Title level={4} style={{ margin: 0, fontSize: isMobile ? '18px' : '22px' }}>{t('organizerHub.featuredRequest')}</Title>
                                <Paragraph style={{ margin: '12px 0 0', fontSize: '16px', color: isDark ? '#d9d9d9' : '#595959' }}>
                                    {t('organizerHub.featuredRequestDesc')}
                                </Paragraph>
                            </Col>
                            <Col xs={24} lg={8} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                                <Button 
                                    danger 
                                    type="primary" 
                                    size="large"
                                    style={{ 
                                        height: 'auto', 
                                        padding: '12px 24px', 
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        whiteSpace: 'normal',
                                        textAlign: 'center',
                                        boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)'
                                    }}
                                    onClick={() => window.open(`https://zalo.me/YOUR_PHONE`, '_blank')}
                                >
                                    {t('organizerHub.featuredContact')}
                                </Button>
                            </Col>
                        </Row>
                    </Card>
                </div>
            )}

            {/* FAQ Section */}
            <div style={{ marginTop: '50px', marginBottom: '80px' }}>
                <Title level={3} style={{ textAlign: 'center', marginBottom: '40px' }}>
                    {t('organizerHub.faqTitle')}
                </Title>
                <Collapse 
                    accordion 
                    ghost
                    expandIconPosition="right"
                    style={{ maxWidth: '800px', margin: '0 auto' }}
                    items={[
                        {
                            key: '1',
                            label: <span style={{ fontSize: '16px', fontWeight: 600 }}>{t('organizerHub.faqQ1')}</span>,
                            children: <Paragraph style={{ fontSize: '15px' }}>{t('organizerHub.faqA1')}</Paragraph>,
                        },
                        {
                            key: '2',
                            label: <span style={{ fontSize: '16px', fontWeight: 600 }}>{t('organizerHub.faqQ2')}</span>,
                            children: <Paragraph style={{ fontSize: '15px' }}>{t('organizerHub.faqA2')}</Paragraph>,
                        },
                        {
                            key: '3',
                            label: <span style={{ fontSize: '16px', fontWeight: 600 }}>{t('organizerHub.faqQ3')}</span>,
                            children: <Paragraph style={{ fontSize: '15px' }}>{t('organizerHub.faqA3')}</Paragraph>,
                        },
                    ]}
                />
            </div>
        </div>
    );
};

export default OrganizerHub;
