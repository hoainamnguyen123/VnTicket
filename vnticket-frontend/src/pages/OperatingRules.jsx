import React, { useEffect } from 'react';
import { Typography, Divider, Card } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const OperatingRules = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <GlobalOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <Title level={1}>Quy Chế Hoạt Động</Title>
                <Text type="secondary">Cập nhật lần cuối: 01/01/2026</Text>
            </div>

            <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Title level={3}>1. Nguyên tắc chung</Title>
                <Paragraph>
                    <Text strong>1.1.</Text> VNTicket là nền tảng thương mại điện tử trung gian, cung cấp dịch vụ kết nối giữa Ban Tổ Chức sự kiện và người mua vé (khán giả).
                </Paragraph>
                <Paragraph>
                    <Text strong>1.2.</Text> VNTicket không trực tiếp tổ chức sự kiện. Trách nhiệm về nội dung, chất lượng, an toàn của sự kiện thuộc về Ban Tổ Chức.
                </Paragraph>
                <Paragraph>
                    <Text strong>1.3.</Text> Nền tảng hoạt động tuân thủ theo Luật Thương mại điện tử, Luật Bảo vệ quyền lợi người tiêu dùng, và các quy định pháp luật liên quan của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
                </Paragraph>

                <Divider />

                <Title level={3}>2. Quy trình đăng ký và duyệt sự kiện</Title>
                <Paragraph>
                    <Text strong>2.1.</Text> Ban Tổ Chức đăng ký tài khoản và gửi yêu cầu tạo sự kiện thông qua biểu mẫu trên nền tảng.
                </Paragraph>
                <Paragraph>
                    <Text strong>2.2.</Text> Yêu cầu tạo sự kiện bao gồm: tên sự kiện, mô tả chi tiết, hình ảnh, thông tin ban tổ chức, thời gian, địa điểm, các loại vé và giá.
                </Paragraph>
                <Paragraph>
                    <Text strong>2.3.</Text> Đội ngũ Quản trị viên (Admin) của VNTicket sẽ xem xét và duyệt sự kiện trong vòng <Text strong>24-48 giờ làm việc</Text>. Admin có quyền từ chối sự kiện nếu:
                </Paragraph>
                <ul>
                    <li><Paragraph>Thông tin sự kiện sai lệch, không đầy đủ, hoặc thiếu tính xác thực.</Paragraph></li>
                    <li><Paragraph>Sự kiện có nội dung vi phạm pháp luật, đạo đức, thuần phong mỹ tục.</Paragraph></li>
                    <li><Paragraph>Ban Tổ Chức không cung cấp đủ giấy phép tổ chức sự kiện (khi được yêu cầu).</Paragraph></li>
                </ul>

                <Divider />

                <Title level={3}>3. Quy định về phí dịch vụ</Title>
                <Paragraph>
                    <Text strong>3.1.</Text> VNTicket thu phí hoa hồng <Text strong>2% trên tổng doanh thu bán vé</Text> cho mỗi sự kiện.
                </Paragraph>
                <Paragraph>
                    <Text strong>3.2.</Text> Phí hoa hồng được trừ tự động khi thanh toán doanh thu cho Ban Tổ Chức. Ban Tổ Chức được cung cấp bảng thống kê chi tiết, minh bạch.
                </Paragraph>
                <Paragraph>
                    <Text strong>3.3.</Text> Người mua vé (khán giả) <Text strong>không bị tính thêm bất kỳ phí dịch vụ nào</Text> ngoài giá vé niêm yết.
                </Paragraph>

                <Divider />

                <Title level={3}>4. Quy định về bán vé</Title>
                <Paragraph>
                    <Text strong>4.1.</Text> Vé được bán trên nguyên tắc "Ai đặt trước, phục vụ trước" (First Come, First Served).
                </Paragraph>
                <Paragraph>
                    <Text strong>4.2.</Text> Mỗi tài khoản có thể mua tối đa <Text strong>10 vé cho cùng một loại vé</Text> trong một giao dịch, nhằm hạn chế đầu cơ.
                </Paragraph>
                <Paragraph>
                    <Text strong>4.3.</Text> VNTicket có quyền hủy các đơn hàng có dấu hiệu gian lận (mua số lượng lớn bất thường, sử dụng bot...).
                </Paragraph>

                <Divider />

                <Title level={3}>5. Quy định về hủy sự kiện</Title>
                <Paragraph>
                    <Text strong>5.1.</Text> Ban Tổ Chức phải thông báo cho VNTicket ít nhất <Text strong>48 giờ trước thời điểm diễn ra</Text> nếu muốn hủy sự kiện.
                </Paragraph>
                <Paragraph>
                    <Text strong>5.2.</Text> Khi sự kiện bị hủy, Ban Tổ Chức chịu trách nhiệm hoàn toàn về việc hoàn tiền cho người mua vé. VNTicket hỗ trợ xử lý hoàn tiền tự động thông qua hệ thống.
                </Paragraph>
                <Paragraph>
                    <Text strong>5.3.</Text> Ban Tổ Chức hủy sự kiện nhiều lần mà không có lý do chính đáng có thể bị hạn chế hoặc cấm sử dụng nền tảng.
                </Paragraph>

                <Divider />

                <Title level={3}>6. Giải quyết tranh chấp</Title>
                <Paragraph>
                    <Text strong>6.1.</Text> Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua thương lượng, hòa giải giữa các bên.
                </Paragraph>
                <Paragraph>
                    <Text strong>6.2.</Text> Nếu không giải quyết được bằng thương lượng, tranh chấp sẽ được đưa ra giải quyết tại cơ quan có thẩm quyền theo quy định pháp luật Việt Nam.
                </Paragraph>
                <Paragraph>
                    <Text strong>6.3.</Text> VNTicket đóng vai trò trung gian hỗ trợ giải quyết, nhưng không chịu trách nhiệm pháp lý cho các tranh chấp giữa Ban Tổ Chức và người mua vé.
                </Paragraph>

                <Divider />

                <Title level={3}>7. Thông tin đơn vị vận hành</Title>
                <ul>
                    <li><Paragraph><Text strong>Tên đơn vị:</Text> Công ty TNHH VNTicket Việt Nam</Paragraph></li>
                    <li><Paragraph><Text strong>Giấy phép ĐKKD:</Text> XXXXXXXXXX</Paragraph></li>
                    <li><Paragraph><Text strong>Trụ sở:</Text> Tầng 5, Tòa nhà VNTicket Tower, Tây Sơn, Phường Kim Liên, Hà Nội</Paragraph></li>
                    <li><Paragraph><Text strong>Email:</Text> info@vnticket.vn</Paragraph></li>
                    <li><Paragraph><Text strong>Hotline:</Text> 1900 xxxx xx</Paragraph></li>
                </ul>
            </Card>
        </div>
    );
};

export default OperatingRules;
