import React, { useEffect, useState } from 'react';
import { Result, Button, Card, Typography, Descriptions, Spin, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import axiosClient from '../api/axiosClient';

const { Title } = Typography;

const PaymentReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [paymentResult, setPaymentResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Lấy tất cả params từ URL để gửi lên backend verify
                const params = Object.fromEntries(searchParams.entries());

                // Gọi backend để verify chữ ký và cập nhật DB
                // axiosClient interceptor đã return response.data (ApiResponse)
                const response = await axiosClient.get('/payment/vnpay-return', { params });
                console.log("Verify response:", response);

                const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
                const vnp_TxnRef = searchParams.get('vnp_TxnRef');
                const vnp_Amount = searchParams.get('vnp_Amount');
                const vnp_BankCode = searchParams.get('vnp_BankCode');
                const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');
                const vnp_PayDate = searchParams.get('vnp_PayDate');
                const vnp_OrderInfo = searchParams.get('vnp_OrderInfo');

                setPaymentResult({
                    success: vnp_ResponseCode === '00' && response.status === 200,
                    responseCode: vnp_ResponseCode,
                    bookingId: vnp_TxnRef,
                    amount: vnp_Amount ? parseInt(vnp_Amount) / 100 : 0,
                    bankCode: vnp_BankCode,
                    transactionNo: vnp_TransactionNo,
                    payDate: vnp_PayDate,
                    orderInfo: vnp_OrderInfo,
                });
            } catch (err) {
                console.error("Payment verification failed", err);
                setError(err.message || "Không thể xác thực giao dịch.");

                setPaymentResult({
                    success: false,
                    bookingId: searchParams.get('vnp_TxnRef'),
                    responseCode: searchParams.get('vnp_ResponseCode'),
                });
            } finally {
                setLoading(false);
            }
        };

        if (searchParams.get('vnp_SecureHash')) {
            verifyPayment();
        } else {
            setLoading(false);
            setError("Thông tin thanh toán không hợp lệ.");
        }
    }, [searchParams]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin indicator={<SyncOutlined spin />} size="large" tip="Đang xác thực giao dịch với VNPay..." />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' }}>
            <Card style={{ width: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                {paymentResult?.success ? (
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title="Thanh toán thành công!"
                        subTitle={`Đơn hàng #${paymentResult.bookingId} đã được xác nhận và cập nhật vào hệ thống.`}
                        extra={[
                            <Button type="primary" key="history" onClick={() => navigate('/history')}>
                                Xem vé của tôi
                            </Button>,
                            <Button key="home" onClick={() => navigate('/')}>
                                Về trang chủ
                            </Button>,
                        ]}
                    >
                        <Descriptions column={1} bordered size="small" style={{ marginTop: '16px' }}>
                            <Descriptions.Item label="Mã đơn hàng">#{paymentResult.bookingId}</Descriptions.Item>
                            <Descriptions.Item label="Số tiền">{formatCurrency(paymentResult.amount)}</Descriptions.Item>
                            <Descriptions.Item label="Ngân hàng">{paymentResult.bankCode}</Descriptions.Item>
                            <Descriptions.Item label="Mã giao dịch VNPay">{paymentResult.transactionNo}</Descriptions.Item>
                        </Descriptions>
                    </Result>
                ) : (
                    <Result
                        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        title="Thanh toán không thành công"
                        subTitle={error || `Giao dịch cho đơn hàng #${paymentResult?.bookingId} bị từ chối hoặc có lỗi xảy ra.`}
                        extra={[
                            <Button type="primary" key="history" onClick={() => navigate('/history')}>
                                Thử lại từ lịch sử
                            </Button>,
                            <Button key="home" onClick={() => navigate('/')}>
                                Về trang chủ
                            </Button>,
                        ]}
                    />
                )}
            </Card>
        </div>
    );
};

export default PaymentReturn;
