import React, { useEffect, useState } from 'react';
import { Result, Button, Card, Typography, Descriptions, Spin, message } from 'antd';
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' }}>
            <Card style={{ width: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                {paymentResult?.success ? (
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title={t('payment.success')}
                        subTitle={t('payment.successSub', { id: paymentResult.bookingId })}
                        extra={[
                            <Button type="primary" key="history" onClick={() => navigate('/history')}>
                                {t('payment.viewMyTickets')}
                            </Button>,
                            <Button key="home" onClick={() => navigate('/')}>
                                {t('payment.goHome')}
                            </Button>,
                        ]}
                    >
                        <Descriptions column={1} bordered size="small" style={{ marginTop: '16px' }}>
                            <Descriptions.Item label={t('payment.orderId')}>#{paymentResult.bookingId}</Descriptions.Item>
                            <Descriptions.Item label={t('payment.amount')}>{formatCurrency(paymentResult.amount)}</Descriptions.Item>
                            <Descriptions.Item label={t('payment.bank')}>{paymentResult.bankCode}</Descriptions.Item>
                            <Descriptions.Item label={t('payment.transactionNo')}>{paymentResult.transactionNo}</Descriptions.Item>
                        </Descriptions>
                    </Result>
                ) : (
                    <Result
                        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        title={t('payment.failed')}
                        subTitle={error || t('payment.failedSub', { id: paymentResult?.bookingId })}
                        extra={[
                            <Button type="primary" key="history" onClick={() => navigate('/history')}>
                                {t('payment.retryFromHistory')}
                            </Button>,
                            <Button key="home" onClick={() => navigate('/')}>
                                {t('payment.goHome')}
                            </Button>,
                        ]}
                    />
                )}
            </Card>
        </div>
    );
};

export default PaymentReturn;
