import React, { useEffect } from 'react';
import { Typography, Collapse, Card } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const faqItems = [
    {
        key: '1',
        label: 'Làm thế nào để mua vé trên VNTicket?',
        children: (
            <Paragraph>
                Rất đơn giản! Bạn chỉ cần:<br />
                1. Truy cập trang chủ VNTicket và tìm sự kiện yêu thích.<br />
                2. Nhấn vào thẻ sự kiện hoặc nút "Mua vé ngay".<br />
                3. Chọn loại vé và số lượng mong muốn.<br />
                4. Đăng nhập (nếu chưa) và tiến hành thanh toán.<br />
                5. Vé điện tử sẽ được gửi đến tài khoản và email của bạn ngay lập tức.
            </Paragraph>
        ),
    },
    {
        key: '2',
        label: 'VNTicket hỗ trợ những phương thức thanh toán nào?',
        children: (
            <Paragraph>
                Chúng tôi hỗ trợ đa dạng phương thức thanh toán:<br />
                • Thẻ ATM nội địa (liên kết Internet Banking)<br />
                • Thẻ quốc tế Visa / MasterCard / JCB<br />
                • Ví điện tử: MoMo, ZaloPay, VNPay<br />
                • Chuyển khoản ngân hàng trực tiếp<br />
                Mọi giao dịch đều được bảo mật bằng công nghệ SSL 256-bit.
            </Paragraph>
        ),
    },
    {
        key: '3',
        label: 'Tôi có thể hoàn vé hoặc đổi vé không?',
        children: (
            <Paragraph>
                Có, VNTicket hỗ trợ hoàn vé theo chính sách hoàn vé cụ thể cho từng sự kiện. Tỷ lệ hoàn tiền phụ thuộc vào thời điểm bạn yêu cầu hoàn so với ngày diễn ra sự kiện. Chi tiết vui lòng xem trang <Text strong>Chính sách hoàn vé</Text>.
                <br /><br />
                <Text type="warning">Lưu ý: Một số sự kiện có chính sách "Không hoàn vé". Thông tin này sẽ được ghi rõ tại trang mua vé.</Text>
            </Paragraph>
        ),
    },
    {
        key: '4',
        label: 'Vé điện tử là gì? Làm sao để sử dụng?',
        children: (
            <Paragraph>
                Vé điện tử (e-ticket) là vé dưới dạng số hiển thị trên tài khoản VNTicket và gửi qua email. Khi đến sự kiện, bạn chỉ cần xuất trình mã QR trên vé điện tử tại quầy kiểm soát. Không cần in vé giấy!
            </Paragraph>
        ),
    },
    {
        key: '5',
        label: 'Tôi muốn tổ chức sự kiện trên VNTicket, cần làm gì?',
        children: (
            <Paragraph>
                Để trở thành Ban Tổ Chức trên VNTicket:<br />
                1. Đăng ký tài khoản người dùng bình thường.<br />
                2. Nhấn nút <Text strong>"Tạo sự kiện"</Text> trên thanh menu.<br />
                3. Điền đầy đủ thông tin sự kiện: tên, mô tả, loại, địa điểm, thời gian, ảnh, loại vé và khu vực.<br />
                4. Gửi yêu cầu và đợi Admin duyệt (thường trong 24-48 giờ).<br />
                5. Sau khi được duyệt, sự kiện sẽ hiển thị công khai trên trang chủ.<br />
                <br />
                <Text type="warning">Lưu ý: VNTicket thu phí hoa hồng 2% trên tổng doanh thu bán vé.</Text>
            </Paragraph>
        ),
    },
    {
        key: '6',
        label: 'Phí hoa hồng 2% được tính như thế nào?',
        children: (
            <Paragraph>
                Phí hoa hồng 2% được tính trên <Text strong>tổng doanh thu bán vé thực tế</Text> của sự kiện. Ví dụ: Nếu tổng doanh thu bán vé là 100.000.000 VNĐ, thì phí hoa hồng VNTicket thu là 2.000.000 VNĐ. Ban Tổ Chức sẽ nhận về 98.000.000 VNĐ.
                <br /><br />
                Bạn có thể theo dõi chi tiết doanh thu tại mục <Text strong>Hồ sơ cá nhân → Sự kiện của tôi → Xem thống kê doanh thu</Text>.
            </Paragraph>
        ),
    },
    {
        key: '7',
        label: 'Sự kiện bị hủy thì tôi được hoàn tiền không?',
        children: (
            <Paragraph>
                Có! Khi sự kiện bị hủy bởi Ban Tổ Chức hoặc do nguyên nhân bất khả kháng, tất cả người mua vé sẽ được hoàn <Text strong>100% giá trị vé</Text>. VNTicket sẽ tự động xử lý hoàn tiền trong vòng 7 ngày làm việc mà bạn không cần phải gửi yêu cầu.
            </Paragraph>
        ),
    },
    {
        key: '8',
        label: 'Tôi quên mật khẩu, làm sao lấy lại?',
        children: (
            <Paragraph>
                Tại trang Đăng nhập, nhấn vào liên kết <Text strong>"Quên mật khẩu?"</Text>. Nhập email đã đăng ký và chúng tôi sẽ gửi liên kết đặt lại mật khẩu đến hộp thư của bạn. Nếu không nhận được email, hãy kiểm tra thư mục Spam hoặc liên hệ Hotline.
            </Paragraph>
        ),
    },
    {
        key: '9',
        label: 'Mua vé nhưng không nhận được email xác nhận?',
        children: (
            <Paragraph>
                Vui lòng kiểm tra:<br />
                • Thư mục Spam / Junk trong email.<br />
                • Đảm bảo email đăng ký tài khoản là chính xác.<br />
                • Vào mục <Text strong>Hồ sơ cá nhân → Lịch sử đặt vé</Text> để xem trạng thái đơn hàng.<br />
                Nếu vẫn không thấy, liên hệ Hotline <Text strong>1900 xxxx xx</Text> để được hỗ trợ.
            </Paragraph>
        ),
    },
    {
        key: '10',
        label: 'VNTicket có ứng dụng di động không?',
        children: (
            <Paragraph>
                Hiện tại VNTicket hoạt động tốt nhất trên trình duyệt web (cả desktop và mobile). Ứng dụng di động đang trong quá trình phát triển và sẽ sớm ra mắt trên App Store và Google Play. Hãy theo dõi chúng tôi để cập nhật thông tin mới nhất!
            </Paragraph>
        ),
    },
];

const FAQ = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <QuestionCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <Title level={1}>Câu Hỏi Thường Gặp (FAQ)</Title>
                <Text type="secondary">Tìm câu trả lời cho những thắc mắc phổ biến nhất</Text>
            </div>

            <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Collapse
                    accordion
                    items={faqItems}
                    size="large"
                    style={{ background: 'transparent', border: 'none' }}
                />
            </Card>

            <Card style={{ borderRadius: 12, marginTop: 24, textAlign: 'center', background: '#f0f5ff', border: '1px solid #d6e4ff' }}>
                <Title level={4} style={{ marginBottom: 8 }}>Không tìm thấy câu trả lời?</Title>
                <Paragraph style={{ marginBottom: 0 }}>
                    Liên hệ đội ngũ hỗ trợ của chúng tôi qua Hotline <Text strong>1900 xxxx xx</Text> (8:00 – 22:00) hoặc email <Text strong>support@vnticket.vn</Text>
                </Paragraph>
            </Card>
        </div>
    );
};

export default FAQ;
