import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Row, Col, Typography, Divider, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    FacebookOutlined,
    YoutubeOutlined,
    InstagramOutlined,
    TikTokOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    SafetyCertificateOutlined,
    CustomerServiceOutlined,
    TeamOutlined,
    FileProtectOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import { Grid } from 'antd';

const { Title, Text, Link } = Typography;

const footerLinkStyle = {
    color: 'rgba(255,255,255,0.75)',
    display: 'block',
    marginBottom: '10px',
    fontSize: '14px',
    transition: 'color 0.3s, padding-left 0.3s',
    cursor: 'pointer',
    textDecoration: 'none',
};

const socialIconStyle = {
    fontSize: '28px',
    color: '#fff',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
};

const AppFooter = () => {
    const { t } = useTranslation();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    if (isMobile) {
        return (
            <footer
                style={{
                    background: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
                    color: '#fff',
                    padding: '30px 20px 40px 20px',
                    textAlign: 'center'
                }}
            >
                <Title level={3} style={{ color: '#fff', marginBottom: 16, fontWeight: 700 }}>
                    🎫 VNTicket
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', display: 'block', marginBottom: 20 }}>
                    {t('footer.description')}
                </Text>

                <Space size={20} style={{ marginBottom: 24 }}>
                    <a href="https://web.facebook.com/nguyen.nam0812hb" style={{ color: '#fff', fontSize: '24px' }}><FacebookOutlined /></a>
                    <a href="#" style={{ color: '#fff', fontSize: '24px' }}><YoutubeOutlined /></a>
                    <a href="#" style={{ color: '#fff', fontSize: '24px' }}><TikTokOutlined /></a>
                </Space>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: 24, flexWrap: 'wrap' }}>
                    <RouterLink to="/terms-of-service" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{t('footer.termsOfService')}</RouterLink>
                    <RouterLink to="/privacy-policy" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{t('footer.privacyPolicy')}</RouterLink>
                    <RouterLink to="/faq" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{t('footer.faq')}</RouterLink>
                </div>

                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '0 0 20px 0' }} />

                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block' }}>
                    {t('footer.copyright', { year: new Date().getFullYear() })}
                </Text>
            </footer>
        );
    }

    return (
        <footer
            className="app-footer"
            style={{
                background: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
                color: '#fff',
                marginTop: '0',
                paddingTop: 60,
            }}
        >
            {/* Main Footer Content */}
            <Row gutter={[48, 40]} style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                {/* Column 1: About */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={3} style={{ color: '#fff', marginBottom: 20, fontWeight: 700 }}>
                        🎫 VNTicket
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.8' }}>
                        {t('footer.description')}
                    </Text>

                    {/* Social Media */}
                    <div style={{ marginTop: 24 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, display: 'block' }}>
                            {t('footer.followUs')}
                        </Text>
                        <Space size={12}>
                            <a href="#" target="_blank" rel="noopener noreferrer" style={socialIconStyle}
                                onMouseOver={e => { e.currentTarget.style.background = '#1877F2'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <FacebookOutlined />
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" style={socialIconStyle}
                                onMouseOver={e => { e.currentTarget.style.background = '#FF0000'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <YoutubeOutlined />
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" style={socialIconStyle}
                                onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <InstagramOutlined />
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" style={socialIconStyle}
                                onMouseOver={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <TikTokOutlined />
                            </a>
                        </Space>
                    </div>
                </Col>

                {/* Column 2: For Users */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={5} style={{ color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>
                        <CustomerServiceOutlined style={{ marginRight: 8 }} />
                        {t('footer.forAudience')}
                    </Title>
                    <RouterLink to="/faq" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >{t('footer.ticketGuide')}</RouterLink>
                    <RouterLink to="/refund-policy" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >{t('footer.refundPolicy')}</RouterLink>
                    <RouterLink to="/faq" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >{t('footer.faq')}</RouterLink>
                    <RouterLink to="/faq" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >{t('footer.paymentMethods')}</RouterLink>
                    <RouterLink to="/faq" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >{t('footer.checkTicket')}</RouterLink>
                </Col>

                {/* Column 3: For Organizers */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={5} style={{ color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>
                        <TeamOutlined style={{ marginRight: 8 }} />
                        {t('footer.forOrganizers')}
                    </Title>
                    <RouterLink to="/operating-rules" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >{t('footer.registerEvent')}</RouterLink>
                    <RouterLink to="/terms-of-service" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >{t('footer.commissionPolicy')}</RouterLink>
                    <RouterLink to="/operating-rules" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >{t('footer.approvalProcess')}</RouterLink>
                    <RouterLink to="/operating-rules" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >{t('footer.revenueReport')}</RouterLink>
                    <RouterLink to="/faq" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >{t('footer.techSupport')}</RouterLink>
                </Col>

                {/* Column 4: Contact & Policies */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={5} style={{ color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>
                        <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                        {t('footer.contactAndPolicies')}
                    </Title>
                    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <EnvironmentOutlined style={{ color: '#4fc3f7', marginTop: 4, flexShrink: 0 }} />
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>
                            {t('footer.address')}
                        </Text>
                    </div>
                    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PhoneOutlined style={{ color: '#4fc3f7', flexShrink: 0 }} />
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>
                            {t('footer.hotline')}
                        </Text>
                    </div>
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MailOutlined style={{ color: '#4fc3f7', flexShrink: 0 }} />
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>
                            support@vnticket.vn
                        </Text>
                    </div>

                    <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

                    <RouterLink to="/privacy-policy" style={{ ...footerLinkStyle, fontSize: '13px' }}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    ><FileProtectOutlined style={{ marginRight: 6 }} />{t('footer.privacyPolicy')}</RouterLink>
                    <RouterLink to="/terms-of-service" style={{ ...footerLinkStyle, fontSize: '13px' }}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    ><SafetyCertificateOutlined style={{ marginRight: 6 }} />{t('footer.termsOfService')}</RouterLink>
                    <RouterLink to="/operating-rules" style={{ ...footerLinkStyle, fontSize: '13px' }}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    ><GlobalOutlined style={{ marginRight: 6 }} />{t('footer.operatingRules')}</RouterLink>
                </Col>
            </Row>

            {/* Bottom Bar */}
            <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '40px 0 0 0' }} />
            <div
                style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    padding: '20px 24px 24px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}
            >
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                    {t('footer.copyright', { year: new Date().getFullYear() })}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                    {t('footer.license')}
                </Text>
            </div>
        </footer>
    );
};

export default AppFooter;
