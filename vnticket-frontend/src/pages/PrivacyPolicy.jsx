import React, { useEffect } from 'react';
import { Typography, Divider, Card } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const PrivacyPolicy = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <Title level={1}>Chính Sách Bảo Mật</Title>
                <Text type="secondary">Cập nhật lần cuối: 01/01/2026</Text>
            </div>

            <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Title level={3}>1. Giới thiệu</Title>
                <Paragraph>
                    VNTicket ("chúng tôi") cam kết bảo vệ quyền riêng tư của người dùng. Chính sách bảo mật này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân của bạn khi sử dụng nền tảng đặt vé sự kiện trực tuyến VNTicket.
                </Paragraph>
                <Paragraph>
                    Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý với các điều khoản trong chính sách bảo mật này.
                </Paragraph>

                <Divider />

                <Title level={3}>2. Thông tin chúng tôi thu thập</Title>
                <Paragraph>
                    <Text strong>2.1. Thông tin bạn cung cấp trực tiếp:</Text>
                </Paragraph>
                <ul>
                    <li><Paragraph>Họ tên, địa chỉ email, số điện thoại khi đăng ký tài khoản.</Paragraph></li>
                    <li><Paragraph>Thông tin thanh toán (số thẻ, tên chủ thẻ) khi thực hiện giao dịch mua vé.</Paragraph></li>
                    <li><Paragraph>Thông tin sự kiện khi bạn đăng ký với tư cách Ban Tổ Chức.</Paragraph></li>
                </ul>
                <Paragraph>
                    <Text strong>2.2. Thông tin tự động thu thập:</Text>
                </Paragraph>
                <ul>
                    <li><Paragraph>Địa chỉ IP, loại trình duyệt, hệ điều hành, thiết bị truy cập.</Paragraph></li>
                    <li><Paragraph>Lịch sử duyệt web, trang đã xem, thời gian truy cập trên nền tảng.</Paragraph></li>
                    <li><Paragraph>Cookie và các công nghệ theo dõi tương tự.</Paragraph></li>
                </ul>

                <Divider />

                <Title level={3}>3. Mục đích sử dụng thông tin</Title>
                <Paragraph>Chúng tôi sử dụng thông tin cá nhân của bạn để:</Paragraph>
                <ul>
                    <li><Paragraph>Xử lý đơn hàng và cung cấp vé điện tử cho các sự kiện bạn đã đặt.</Paragraph></li>
                    <li><Paragraph>Quản lý tài khoản người dùng và hỗ trợ khách hàng.</Paragraph></li>
                    <li><Paragraph>Gửi thông báo về sự kiện, khuyến mãi và cập nhật dịch vụ (có thể từ chối nhận).</Paragraph></li>
                    <li><Paragraph>Cải thiện trải nghiệm người dùng và phát triển tính năng mới.</Paragraph></li>
                    <li><Paragraph>Phòng chống gian lận, bảo mật hệ thống và tuân thủ pháp luật.</Paragraph></li>
                </ul>

                <Divider />

                <Title level={3}>4. Chia sẻ thông tin</Title>
                <Paragraph>
                    Chúng tôi <Text strong>không bán, trao đổi hoặc cho thuê</Text> thông tin cá nhân của bạn cho bên thứ ba. Tuy nhiên, chúng tôi có thể chia sẻ thông tin trong các trường hợp sau:
                </Paragraph>
                <ul>
                    <li><Paragraph><Text strong>Ban Tổ Chức sự kiện:</Text> Tên và thông tin vé của bạn sẽ được chia sẻ với Ban Tổ Chức để xác nhận quyền tham gia sự kiện.</Paragraph></li>
                    <li><Paragraph><Text strong>Đối tác thanh toán:</Text> Thông tin thanh toán được mã hóa và truyền an toàn tới đối tác cổng thanh toán được cấp phép.</Paragraph></li>
                    <li><Paragraph><Text strong>Yêu cầu pháp lý:</Text> Khi có yêu cầu từ cơ quan chức năng theo quy định pháp luật Việt Nam.</Paragraph></li>
                </ul>

                <Divider />

                <Title level={3}>5. Bảo mật thông tin</Title>
                <Paragraph>
                    Chúng tôi áp dụng các biện pháp bảo mật tiên tiến để bảo vệ thông tin của bạn:
                </Paragraph>
                <ul>
                    <li><Paragraph>Mã hóa SSL/TLS cho toàn bộ dữ liệu truyền tải.</Paragraph></li>
                    <li><Paragraph>Mã hóa mật khẩu bằng thuật toán BCrypt.</Paragraph></li>
                    <li><Paragraph>Xác thực bằng JWT Token với thời hạn giới hạn.</Paragraph></li>
                    <li><Paragraph>Hệ thống tường lửa và giám sát truy cập 24/7.</Paragraph></li>
                    <li><Paragraph>Sao lưu dữ liệu định kỳ và kế hoạch phục hồi thảm họa.</Paragraph></li>
                </ul>

                <Divider />

                <Title level={3}>6. Quyền của người dùng</Title>
                <Paragraph>Bạn có các quyền sau đối với thông tin cá nhân:</Paragraph>
                <ul>
                    <li><Paragraph><Text strong>Quyền truy cập:</Text> Xem và tải xuống dữ liệu cá nhân chúng tôi lưu trữ về bạn.</Paragraph></li>
                    <li><Paragraph><Text strong>Quyền chỉnh sửa:</Text> Cập nhật, sửa đổi thông tin cá nhân không chính xác.</Paragraph></li>
                    <li><Paragraph><Text strong>Quyền xóa:</Text> Yêu cầu xóa tài khoản và dữ liệu cá nhân (trừ dữ liệu cần lưu giữ theo quy định pháp luật).</Paragraph></li>
                    <li><Paragraph><Text strong>Quyền từ chối:</Text> Hủy đăng ký nhận email marketing bất cứ lúc nào.</Paragraph></li>
                </ul>

                <Divider />

                <Title level={3}>7. Cookie</Title>
                <Paragraph>
                    VNTicket sử dụng cookie để cải thiện trải nghiệm duyệt web. Cookie giúp ghi nhớ thông tin đăng nhập, tùy chọn cá nhân và phân tích lưu lượng truy cập. Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng có thể bị hạn chế.
                </Paragraph>

                <Divider />

                <Title level={3}>8. Liên hệ</Title>
                <Paragraph>
                    Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật, vui lòng liên hệ:
                </Paragraph>
                <ul>
                    <li><Paragraph><Text strong>Email:</Text> privacy@vnticket.vn</Paragraph></li>
                    <li><Paragraph><Text strong>Hotline:</Text> 1900 xxxx xx</Paragraph></li>
                    <li><Paragraph><Text strong>Địa chỉ:</Text> Tầng 5, Tòa nhà VNTicket Tower, Tây Sơn, Phường Kim Liên, Hà Nội</Paragraph></li>
                </ul>
            </Card>
        </div>
    );
};

export default PrivacyPolicy;
