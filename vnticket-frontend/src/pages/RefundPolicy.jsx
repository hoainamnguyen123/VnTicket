import React, { useEffect } from 'react';
import { Typography, Divider, Card, Table, Tag } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const refundData = [
    { key: '1', timeframe: 'Trước sự kiện 7 ngày trở lên', refundRate: '100%', tag: 'green' },
    { key: '2', timeframe: 'Trước sự kiện 3 – 7 ngày', refundRate: '70%', tag: 'blue' },
    { key: '3', timeframe: 'Trước sự kiện 1 – 3 ngày', refundRate: '50%', tag: 'orange' },
    { key: '4', timeframe: 'Trong vòng 24 giờ trước sự kiện', refundRate: '0% (Không hoàn)', tag: 'red' },
    { key: '5', timeframe: 'Sự kiện bị hủy bởi Ban Tổ Chức', refundRate: '100%', tag: 'green' },
];

const refundColumns = [
    { title: 'Thời điểm yêu cầu hoàn vé', dataIndex: 'timeframe', key: 'timeframe' },
    {
        title: 'Tỷ lệ hoàn tiền', dataIndex: 'refundRate', key: 'refundRate',
        render: (text, record) => <Tag color={record.tag} style={{ fontSize: 14, padding: '4px 12px' }}>{text}</Tag>
    },
];

const RefundPolicy = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <RollbackOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <Title level={1}>Chính Sách Hoàn Vé</Title>
                <Text type="secondary">Cập nhật lần cuối: 01/01/2026</Text>
            </div>

            <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Title level={3}>1. Điều kiện hoàn vé</Title>
                <Paragraph>
                    VNTicket hỗ trợ hoàn vé cho người dùng trong các trường hợp hợp lệ. Việc hoàn vé phụ thuộc vào thời điểm yêu cầu và chính sách riêng của từng sự kiện do Ban Tổ Chức quy định.
                </Paragraph>
                <Paragraph>
                    <Text type="warning" strong>Lưu ý:</Text> Một số sự kiện có thể áp dụng chính sách "Không hoàn vé" (Non-refundable). Thông tin này sẽ được ghi rõ tại thời điểm mua vé.
                </Paragraph>

                <Divider />

                <Title level={3}>2. Bảng tỷ lệ hoàn tiền</Title>
                <Paragraph>
                    Dưới đây là bảng tỷ lệ hoàn tiền tiêu chuẩn áp dụng cho các sự kiện cho phép hoàn vé:
                </Paragraph>
                <Table
                    dataSource={refundData}
                    columns={refundColumns}
                    pagination={false}
                    bordered
                    style={{ marginBottom: 24 }}
                />

                <Divider />

                <Title level={3}>3. Quy trình yêu cầu hoàn vé</Title>
                <Paragraph><Text strong>Bước 1:</Text> Đăng nhập vào tài khoản VNTicket của bạn.</Paragraph>
                <Paragraph><Text strong>Bước 2:</Text> Vào mục <Text code>Hồ sơ cá nhân → Lịch sử đặt vé</Text>.</Paragraph>
                <Paragraph><Text strong>Bước 3:</Text> Chọn vé cần hoàn và nhấn nút <Text code>Yêu cầu hoàn vé</Text>.</Paragraph>
                <Paragraph><Text strong>Bước 4:</Text> Điền lý do hoàn vé và xác nhận yêu cầu.</Paragraph>
                <Paragraph><Text strong>Bước 5:</Text> Đợi xử lý trong vòng <Text strong>3-5 ngày làm việc</Text>. Tiền sẽ được hoàn về phương thức thanh toán ban đầu.</Paragraph>

                <Divider />

                <Title level={3}>4. Trường hợp sự kiện bị hủy</Title>
                <Paragraph>
                    Khi sự kiện bị hủy bởi Ban Tổ Chức hoặc do bất khả kháng (thiên tai, dịch bệnh, quy định của chính quyền), người dùng sẽ được hoàn <Text strong>100% giá trị vé</Text> mà không cần gửi yêu cầu. VNTicket sẽ tự động xử lý hoàn tiền trong vòng 7 ngày làm việc.
                </Paragraph>

                <Divider />

                <Title level={3}>5. Trường hợp không được hoàn vé</Title>
                <ul>
                    <li><Paragraph>Vé đã được sử dụng (đã check-in tại sự kiện).</Paragraph></li>
                    <li><Paragraph>Vé mua từ chương trình khuyến mãi đặc biệt có ghi rõ "Không hoàn, không đổi".</Paragraph></li>
                    <li><Paragraph>Yêu cầu hoàn vé sau khi sự kiện đã diễn ra.</Paragraph></li>
                    <li><Paragraph>Người dùng vi phạm Điều khoản sử dụng của VNTicket.</Paragraph></li>
                </ul>

                <Divider />

                <Title level={3}>6. Liên hệ hỗ trợ</Title>
                <Paragraph>
                    Nếu gặp vấn đề trong quá trình hoàn vé, vui lòng liên hệ:
                </Paragraph>
                <ul>
                    <li><Paragraph><Text strong>Email:</Text> refund@vnticket.vn</Paragraph></li>
                    <li><Paragraph><Text strong>Hotline:</Text> 1900 xxxx xx (8:00 – 22:00 hàng ngày)</Paragraph></li>
                </ul>
            </Card>
        </div>
    );
};

export default RefundPolicy;
