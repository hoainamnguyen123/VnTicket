import React, { useEffect } from 'react';
import { Typography, Divider, Card } from 'antd';
import { FileProtectOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const TermsOfService = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <FileProtectOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <Title level={1}>Điều Khoản Sử Dụng</Title>
                <Text type="secondary">Cập nhật lần cuối: 01/01/2026</Text>
            </div>

            <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Title level={3}>1. Điều khoản chung</Title>
                <Paragraph>
                    Chào mừng bạn đến với VNTicket. Bằng việc truy cập và sử dụng nền tảng VNTicket (bao gồm website và ứng dụng di động), bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu dưới đây. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng dịch vụ.
                </Paragraph>

                <Divider />

                <Title level={3}>2. Định nghĩa</Title>
                <ul>
                    <li><Paragraph><Text strong>"Nền tảng":</Text> Website và các ứng dụng liên quan do VNTicket vận hành.</Paragraph></li>
                    <li><Paragraph><Text strong>"Người dùng":</Text> Bất kỳ cá nhân nào truy cập hoặc sử dụng nền tảng, bao gồm khán giả và Ban Tổ Chức.</Paragraph></li>
                    <li><Paragraph><Text strong>"Ban Tổ Chức":</Text> Cá nhân hoặc tổ chức đăng ký tạo và quản lý sự kiện trên nền tảng.</Paragraph></li>
                    <li><Paragraph><Text strong>"Vé điện tử":</Text> Vé sự kiện dưới dạng số được phát hành thông qua nền tảng.</Paragraph></li>
                </ul>

                <Divider />

                <Title level={3}>3. Tài khoản người dùng</Title>
                <Paragraph>
                    <Text strong>3.1.</Text> Bạn phải cung cấp thông tin chính xác, đầy đủ khi đăng ký tài khoản. Mỗi cá nhân chỉ được sở hữu một tài khoản duy nhất.
                </Paragraph>
                <Paragraph>
                    <Text strong>3.2.</Text> Bạn chịu trách nhiệm bảo mật thông tin đăng nhập. Mọi hoạt động từ tài khoản của bạn đều được coi là do bạn thực hiện.
                </Paragraph>
                <Paragraph>
                    <Text strong>3.3.</Text> VNTicket có quyền tạm khóa hoặc xóa tài khoản vi phạm điều khoản mà không cần thông báo trước.
                </Paragraph>

                <Divider />

                <Title level={3}>4. Quy định mua vé</Title>
                <Paragraph>
                    <Text strong>4.1.</Text> Vé mua trên VNTicket là vé điện tử, chỉ có giá trị sử dụng một lần cho sự kiện cụ thể đã đặt.
                </Paragraph>
                <Paragraph>
                    <Text strong>4.2.</Text> Giá vé được hiển thị đã bao gồm thuế (nếu có). Phí dịch vụ bổ sung sẽ được thông báo rõ ràng trước khi thanh toán.
                </Paragraph>
                <Paragraph>
                    <Text strong>4.3.</Text> Vé đã mua thành công sẽ không thể chuyển nhượng cho người khác trừ khi được VNTicket và Ban Tổ Chức cho phép.
                </Paragraph>
                <Paragraph>
                    <Text strong>4.4.</Text> Nghiêm cấm mua vé với mục đích đầu cơ, phe vé, hoặc bán lại với giá cao hơn giá gốc.
                </Paragraph>

                <Divider />

                <Title level={3}>5. Quy định dành cho Ban Tổ Chức</Title>
                <Paragraph>
                    <Text strong>5.1.</Text> Ban Tổ Chức phải cung cấp thông tin sự kiện chính xác, đầy đủ và chịu trách nhiệm về tính hợp pháp của sự kiện.
                </Paragraph>
                <Paragraph>
                    <Text strong>5.2.</Text> Mọi sự kiện phải được Admin của VNTicket duyệt trước khi công khai trên nền tảng.
                </Paragraph>
                <Paragraph>
                    <Text strong>5.3.</Text> VNTicket sẽ thu phí hoa hồng <Text strong>2% trên tổng doanh thu bán vé</Text> của mỗi sự kiện. Phí này sẽ được trừ trực tiếp trước khi chuyển doanh thu về cho Ban Tổ Chức.
                </Paragraph>
                <Paragraph>
                    <Text strong>5.4.</Text> Ban Tổ Chức chịu trách nhiệm về chất lượng sự kiện, an ninh, an toàn cho người tham gia.
                </Paragraph>

                <Divider />

                <Title level={3}>6. Thanh toán</Title>
                <Paragraph>
                    VNTicket hỗ trợ các phương thức thanh toán: Thẻ nội địa (ATM), Thẻ quốc tế (Visa/MasterCard), Ví điện tử (MoMo, ZaloPay, VNPay), và Chuyển khoản ngân hàng. Mọi giao dịch được bảo mật bằng công nghệ mã hóa tiên tiến.
                </Paragraph>

                <Divider />

                <Title level={3}>7. Giới hạn trách nhiệm</Title>
                <Paragraph>
                    <Text strong>7.1.</Text> VNTicket là nền tảng trung gian kết nối Ban Tổ Chức và khán giả. Chúng tôi không chịu trách nhiệm trực tiếp về nội dung, chất lượng hoặc việc hủy bỏ sự kiện do Ban Tổ Chức.
                </Paragraph>
                <Paragraph>
                    <Text strong>7.2.</Text> Trong trường hợp sự kiện bị hủy, VNTicket sẽ hỗ trợ người dùng liên hệ Ban Tổ Chức để giải quyết hoàn vé theo chính sách hoàn vé.
                </Paragraph>

                <Divider />

                <Title level={3}>8. Sở hữu trí tuệ</Title>
                <Paragraph>
                    Toàn bộ nội dung trên nền tảng VNTicket bao gồm logo, thiết kế, mã nguồn, văn bản đều thuộc sở hữu của VNTicket hoặc được cấp phép hợp pháp. Nghiêm cấm sao chép, phân phối mà không có sự đồng ý bằng văn bản.
                </Paragraph>

                <Divider />

                <Title level={3}>9. Liên hệ</Title>
                <Paragraph>
                    Mọi thắc mắc về Điều khoản sử dụng, vui lòng liên hệ:
                </Paragraph>
                <ul>
                    <li><Paragraph><Text strong>Email:</Text> legal@vnticket.vn</Paragraph></li>
                    <li><Paragraph><Text strong>Hotline:</Text> 1900 xxxx xx</Paragraph></li>
                    <li><Paragraph><Text strong>Địa chỉ:</Text> Tầng 5, Tòa nhà VNTicket Tower, Tây Sơn, Phường Kim Liên, Hà Nội</Paragraph></li>
                </ul>
            </Card>
        </div>
    );
};

export default TermsOfService;
