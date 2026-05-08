import React, { useEffect, useState } from 'react';
import { Result, Button, Card, Typography, Descriptions, Spin, message, Grid } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatters';
import axiosClient from '../api/axiosClient';

const { Title } = Typography;

const PaymentReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [paymentResult, setPaymentResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useTranslation();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const params = Object.fromEntries(searchParams.entries());
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
                setError(err.message || t('payment.verifyError'));

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
            setError(t('payment.invalidInfo'));
        }
    }, [searchParams, t]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin indicator={<SyncOutlined spin />} size="large" tip={t('payment.verifying')} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: isMobile ? '10px' : '20px' }}>
            <Card 
                style={{ width: '100%', maxWidth: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}
                styles={{ body: { padding: isMobile ? '16px 12px' : '24px' } }}
            >
                {paymentResult?.success ? (
                    <Result
                        style={{ padding: isMobile ? '16px 0' : '48px 32px' }}
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title={t('payment.success')}
                        subTitle={t('payment.successSub', { id: paymentResult.bookingId })}
                        extra={
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', justifyContent: 'center' }}>
                                <Button type="primary" key="history" onClick={() => navigate('/history?tab=PAID')} style={{ width: isMobile ? '100%' : 'auto' }}>
                                    {t('payment.viewMyTickets')}
                                </Button>
                                <Button key="home" onClick={() => navigate('/')} style={{ width: isMobile ? '100%' : 'auto' }}>
                                    {t('payment.goHome')}
                                </Button>
                            </div>
                        }
                    >
                        <div style={{ marginBottom: 16, width: '100%' }}>
                            <div style={{ padding: isMobile ? '8px 10px' : '12px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: isMobile ? '8px' : '12px', width: '100%' }}>
                                <span style={{ fontSize: '20px', flexShrink: 0 }}>🎟️</span>
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: '#389e0d', marginBottom: '4px' }}>Vé điện tử đã được gửi!</div>
                                    <div style={{ color: '#595959', fontSize: '14px' }}>
                                        Vui lòng kiểm tra email của bạn để nhận vé và mã QR. Nếu không thấy, hãy kiểm tra thư mục Spam.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Descriptions 
                            column={1} 
                            bordered={!isMobile}
                            size="small" 
                            layout={isMobile ? "vertical" : "horizontal"}
                            style={{ marginTop: '16px', textAlign: 'left', width: '100%' }}
                            labelStyle={isMobile ? { paddingBottom: '4px', color: '#8c8c8c' } : { whiteSpace: 'nowrap' }}
                            contentStyle={isMobile ? { paddingBottom: '16px', wordBreak: 'break-all' } : {}}
                        >
                            <Descriptions.Item label={t('payment.orderId')}>#{paymentResult.bookingId}</Descriptions.Item>
                            <Descriptions.Item label={t('payment.amount')}>{formatCurrency(paymentResult.amount)}</Descriptions.Item>
                            <Descriptions.Item label={t('payment.bank')}>{paymentResult.bankCode}</Descriptions.Item>
                            <Descriptions.Item label={t('payment.transactionNo')}>{paymentResult.transactionNo}</Descriptions.Item>
                        </Descriptions>
                    </Result>
                ) : (
                    <Result
                        style={{ padding: isMobile ? '16px 0' : '48px 32px' }}
                        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        title={t('payment.failed')}
                        subTitle={error || t('payment.failedSub', { id: paymentResult?.bookingId })}
                        extra={
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', justifyContent: 'center' }}>
                                <Button type="primary" key="history" onClick={() => navigate('/history?tab=PENDING')} style={{ width: isMobile ? '100%' : 'auto' }}>
                                    {t('payment.retryFromHistory')}
                                </Button>
                                <Button key="home" onClick={() => navigate('/')} style={{ width: isMobile ? '100%' : 'auto' }}>
                                    {t('payment.goHome')}
                                </Button>
                            </div>
                        }
                    />
                )}
            </Card>
        </div>
    );
};

export default PaymentReturn;
