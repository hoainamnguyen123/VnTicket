import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Row, Col, Typography, Divider, Space } from 'antd';
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
    return (
        <footer
            className="app-footer"
            style={{
                background: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
                color: '#fff',
                marginTop: '0',
            }}
        >
            {/* Main Footer Content */}
            <Row gutter={[48, 40]} style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Column 1: About */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={3} style={{ color: '#fff', marginBottom: 20, fontWeight: 700 }}>
                        🎫 VNTicket
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.8' }}>
                        Nền tảng đặt vé sự kiện trực tuyến hàng đầu Việt Nam.
                        Kết nối khán giả với những sự kiện âm nhạc, thể thao, văn hóa chất lượng nhất.
                    </Text>

                    {/* Social Media */}
                    <div style={{ marginTop: 24 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, display: 'block' }}>
                            Theo dõi chúng tôi
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
                        Dành cho Khán giả
                    </Title>
                    <RouterLink to="/faq" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >Hướng dẫn mua vé</RouterLink>
                    <RouterLink to="/refund-policy" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >Chính sách hoàn vé</RouterLink>
                    <RouterLink to="/faq" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >Câu hỏi thường gặp (FAQ)</RouterLink>
                    <RouterLink to="/faq" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >Phương thức thanh toán</RouterLink>
                    <RouterLink to="/faq" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >Kiểm tra vé điện tử</RouterLink>
                </Col>

                {/* Column 3: For Organizers */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={5} style={{ color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>
                        <TeamOutlined style={{ marginRight: 8 }} />
                        Dành cho Ban Tổ Chức
                    </Title>
                    <RouterLink to="/operating-rules" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >Đăng ký tổ chức sự kiện</RouterLink>
                    <RouterLink to="/terms-of-service" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >Chính sách hoa hồng (2%)</RouterLink>
                    <RouterLink to="/operating-rules" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >Quy trình duyệt sự kiện</RouterLink>
                    <RouterLink to="/operating-rules" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >Báo cáo doanh thu</RouterLink>
                    <RouterLink to="/faq" style={footerLinkStyle}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    >Hỗ trợ kỹ thuật</RouterLink>
                </Col>

                {/* Column 4: Contact & Policies */}
                <Col xs={24} sm={12} md={6}>
                    <Title level={5} style={{ color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>
                        <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                        Liên hệ & Chính sách
                    </Title>
                    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <EnvironmentOutlined style={{ color: '#4fc3f7', marginTop: 4, flexShrink: 0 }} />
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>
                            Tầng 5, Tòa nhà VNTicket Tower, Tây Sơn, Phường Kim Liên, Hà Nội
                        </Text>
                    </div>
                    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PhoneOutlined style={{ color: '#4fc3f7', flexShrink: 0 }} />
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>
                            Hotline: 1900 xxxx xx
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
                    ><FileProtectOutlined style={{ marginRight: 6 }} />Chính sách bảo mật</RouterLink>
                    <RouterLink to="/terms-of-service" style={{ ...footerLinkStyle, fontSize: '13px' }}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    ><SafetyCertificateOutlined style={{ marginRight: 6 }} />Điều khoản sử dụng</RouterLink>
                    <RouterLink to="/operating-rules" style={{ ...footerLinkStyle, fontSize: '13px' }}
                        onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.paddingLeft = '0'; }}
                    ><GlobalOutlined style={{ marginRight: 6 }} />Quy chế hoạt động</RouterLink>
                </Col>
            </Row>

            {/* Bottom Bar */}
            <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '40px 0 0 0' }} />
            <div
                style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    padding: '20px 0 24px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}
            >
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                    © {new Date().getFullYear()} VNTicket. Tất cả quyền được bảo lưu.
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                    Giấy phép ĐKKD số: XXXXXXXXXX — Cấp ngày: XX/XX/XXXX bởi Sở KH&ĐT TP.HCM
                </Text>
            </div>
        </footer>
    );
};

export default AppFooter;
