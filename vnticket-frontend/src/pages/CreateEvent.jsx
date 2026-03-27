import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Select, DatePicker, Row, Col, Space, Button, Alert, Card, Typography, Divider, Checkbox, message, Modal } from 'antd';
import { MinusCircleOutlined, PlusOutlined, InfoCircleOutlined, PictureOutlined, EnvironmentOutlined, TagsOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import ImageUploadInput from '../components/ImageUploadInput';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const CreateEvent = () => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { isDark } = useContext(ThemeContext);
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [isWarningVisible, setIsWarningVisible] = useState(true);

    useEffect(() => {
        if (!user) {
            message.warning(t('eventDetail.loginRequired') || "Vui lòng đăng nhập để tạo sự kiện!");
            navigate('/login');
            return;
        }
        axios.get('https://provinces.open-api.vn/api/v2/p/')
            .then(res => setProvinces(res.data))
            .catch(err => console.error("Lỗi khi tải tỉnh thành:", err));
    }, [user, navigate]);

    const handleProvinceChange = (provinceName) => {
        const selectedProv = provinces.find(p => p.name === provinceName);
        if (selectedProv) {
            axios.get(`https://provinces.open-api.vn/api/v2/p/${selectedProv.code}?depth=2`)
                .then(res => setWards(res.data.wards || []))
                .catch(err => console.error("Lỗi khi tải phường xã:", err));
        } else {
            setWards([]);
        }
        form.setFieldsValue({ ward: undefined });
    };

    const handleCreateEvent = async (values) => {
        if (!agreed) {
            message.error(t('createEventPage.termsAndConditionsError', 'Vui lòng đồng ý với các Điều khoản của nền tảng.'));
            return;
        }
        setSubmitting(true);
        try {
            const combinedLocation = [values.detailAddress, values.ward, values.province].filter(Boolean).join(', ');
            const eventData = {
                ...values,
                location: combinedLocation,
                startTime: values.startTime.format('YYYY-MM-DDTHH:mm:ss'),
                additionalImages: values.additionalImages?.map(item => item?.url || item) || [],
                ticketTypes: values.ticketTypes || []
            };

            delete eventData.province;
            delete eventData.ward;
            delete eventData.detailAddress;

            await axiosClient.post('/events/my', eventData);
            message.success(t('navbar.createEventSuccess') || 'Yêu cầu tạo sự kiện của bạn đã được gửi thành công.');
            navigate('/profile');
        } catch (error) {
            message.error(error.response?.data?.message || t('navbar.createEventError') || 'Có lỗi xảy ra khi tạo sự kiện.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <Title level={2}>{t('createEventPage.title')}</Title>
                <Text type="secondary">{t('createEventPage.subtitle')}</Text>
            </div>

            <Alert
                message={t('createEventPage.feeNotice')}
                description={t('createEventPage.feeDesc')}
                type="info"
                showIcon
                style={{ marginBottom: 24, borderRadius: 8 }}
            />

            <Form form={form} layout="vertical" onFinish={handleCreateEvent} size="large">
                
                {/* Thông tin cơ bản */}
                <Card 
                    title={<><InfoCircleOutlined style={{ marginRight: 8 }} /> {t('createEventPage.basicInfo')}</>} 
                    bordered={false} 
                    style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item name="name" label={t('createEventPage.eventName')} rules={[{ required: true, message: t('createEventPage.eventNameRequired') }]}>
                                <Input placeholder={t('createEventPage.eventNamePlaceholder')} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="organizerName" label={t('createEventPage.organizerName')} rules={[{ required: true, message: t('createEventPage.organizerRequired') }]}>
                                <Input placeholder={t('createEventPage.organizerPlaceholder')} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="type" label={t('createEventPage.eventType')} rules={[{ required: true, message: t('createEventPage.eventTypeRequired') }]}>
                                <Select placeholder={t('createEventPage.eventType')}>
                                    <Option value="Âm nhạc">{t('createEventPage.eventTypes.music')}</Option>
                                    <Option value="Thể thao">{t('createEventPage.eventTypes.sports')}</Option>
                                    <Option value="Hội thảo">{t('createEventPage.eventTypes.conference')}</Option>
                                    <Option value="Tham quan, Trải nghiệm">{t('createEventPage.eventTypes.experience')}</Option>
                                    <Option value="Sân khấu, Nghệ thuật">{t('createEventPage.eventTypes.art')}</Option>
                                    <Option value="Khác">{t('createEventPage.eventTypes.other')}</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item name="description" label={t('createEventPage.eventDesc')} rules={[{ required: true, message: t('createEventPage.eventDescRequired') }]}>
                                <TextArea rows={5} placeholder={t('createEventPage.eventDescPlaceholder')} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* Thời gian và Địa điểm */}
                <Card 
                    title={<><EnvironmentOutlined style={{ marginRight: 8 }} /> {t('createEventPage.timeAndLocation')}</>} 
                    bordered={false} 
                    style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item name="startTime" label={t('createEventPage.startTime')} rules={[{ required: true, message: t('createEventPage.startTimeRequired') }]}>
                                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider dashed />
                    <Row gutter={24}>
                        <Col xs={24} md={8}>
                            <Form.Item name="province" label={t('createEventPage.province')} rules={[{ required: true, message: t('createEventPage.provinceRequired') }]}>
                                <Select showSearch placeholder={t('createEventPage.province')} optionFilterProp="children" onChange={handleProvinceChange}>
                                    {provinces.map(prov => <Option key={prov.code} value={prov.name}>{prov.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="ward" label={t('createEventPage.ward')} rules={[{ required: true, message: t('createEventPage.wardRequired') }]}>
                                <Select showSearch placeholder={t('createEventPage.ward')} optionFilterProp="children">
                                    {wards.map(w => <Option key={w.code} value={w.name}>{w.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="detailAddress" label={t('createEventPage.detailAddress')} rules={[{ required: true, message: t('createEventPage.detailAddressRequired') }]}>
                                <Input placeholder={t('createEventPage.detailAddressPlaceholder')} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* Banner & Hình Ảnh */}
                <Card 
                    title={<><PictureOutlined style={{ marginRight: 8 }} /> {t('createEventPage.images')}</>} 
                    bordered={false} 
                    style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                    <Form.Item name="imageUrl" label={t('createEventPage.mainImage')} rules={[{ required: true, message: t('createEventPage.mainImageRequired') }]}>
                        <ImageUploadInput isBanner={true} />
                    </Form.Item>

                    <Form.List name="additionalImages">
                        {(fields, { add, remove }) => (
                            <>
                                <Text strong style={{display: 'block', paddingBottom: '10px'}}>{t('createEventPage.extraImages')}</Text>
                                <div style={{ background: 'transparent', padding: 16, borderRadius: 8, display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start', marginBottom: 16 }}>
                                    {fields.map((field, index) => (
                                        <div key={field.key} style={{ position: 'relative', width: '104px', height: '104px' }}>
                                            <div style={{ position: 'absolute', top: -10, right: -10, cursor: 'pointer', zIndex: 10 }}>
                                                <Button type="primary" danger shape="circle" icon={<MinusCircleOutlined />} size="small" onClick={() => remove(field.name)} />
                                            </div>
                                            <Form.Item {...field} validateTrigger={['onChange', 'onBlur']} rules={[{ required: true, message: "Vui lòng tải ảnh." }]} noStyle>
                                                <ImageUploadInput />
                                            </Form.Item>
                                        </div>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} style={{ width: '104px', height: '104px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent' }}>
                                        <PlusOutlined style={{ fontSize: '18px', marginBottom: '8px' }} />
                                        Thêm Ảnh
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form.List>
                </Card>

                {/* Hạng Nhóm Hạng Vé */}
                <Card 
                    title={<><TagsOutlined style={{ marginRight: 8 }} /> {t('createEventPage.tickets')}</>} 
                    bordered={false} 
                    style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                    <Form.List name="ticketTypes">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row gutter={16} key={key} style={{ background: isDark ? '#141414' : '#fafafa', padding: '16px 16px 0', marginBottom: 16, borderRadius: 8 }}>
                                        <Col xs={24} md={8}>
                                            <Form.Item {...restField} name={[name, 'zoneName']} label={t('createEventPage.zoneName')} rules={[{ required: true, message: t('createEventPage.zoneNameRequired') }]}>
                                                <Input placeholder={t('createEventPage.zoneNamePlaceholder')} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={7}>
                                            <Form.Item {...restField} name={[name, 'price']} label={t('createEventPage.ticketPrice')} rules={[{ required: true, message: t('createEventPage.ticketPriceRequired') }]}>
                                                <Input type="number" placeholder={t('createEventPage.freeTicket')} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={7}>
                                            <Form.Item {...restField} name={[name, 'totalQuantity']} label={t('createEventPage.ticketQuantity')} rules={[{ required: true, message: t('createEventPage.ticketQuantityRequired') }]}>
                                                <Input type="number" placeholder={t('createEventPage.ticketQuantityPlaceholder')} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={2} style={{ display: 'flex', alignItems: 'center', paddingBottom: '24px' }}>
                                            <Button danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} style={{ width: '100%' }} />
                                        </Col>
                                    </Row>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ height: '45px' }}>
                                        {t('createEventPage.addTicket')}
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Card>

                {/* Cam kết & Submit */}
                <div style={{ padding: '0 10px 40px', textAlign: 'center' }}>
                    <div style={{ marginBottom: 24 }}>
                        <Checkbox 
                            checked={agreed} 
                            onChange={(e) => setAgreed(e.target.checked)}
                            style={{ fontSize: 16 }}
                        >
                            {t('createEventPage.termsAndConditions')}
                        </Checkbox>
                    </div>
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        size="large" 
                        icon={<CheckCircleOutlined />} 
                        loading={submitting}
                        style={{ width: '100%', maxWidth: '400px', height: '56px', fontSize: '18px', borderRadius: '28px', boxShadow: '0 6px 16px rgba(24,144,255,0.4)' }}
                    >
                        {t('createEventPage.submitBtn')}
                    </Button>
                    <div style={{ marginTop: '24px', maxWidth: '600px', margin: '24px auto 0' }}>
                        <Alert
                            message={t('createEventPage.approvalNote')}
                            type="info"
                            showIcon
                            style={{ borderRadius: '8px', textAlign: 'left' }}
                        />
                    </div>
                </div>
            </Form>

            <Modal
                title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>{t('createEventPage.warningTitle')}</span>}
                open={isWarningVisible}
                onOk={() => setIsWarningVisible(false)}
                onCancel={() => setIsWarningVisible(false)}
                footer={[
                    <Button key="submit" type="primary" onClick={() => setIsWarningVisible(false)}>
                        {t('createEventPage.understandBtn')}
                    </Button>
                ]}
                width={700}
                centered
                closable={false}
                maskClosable={false}
            >
                <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                    <p>{t('createEventPage.rule1')}</p>
                    <p>{t('createEventPage.rule2')}</p>
                    <p>{t('createEventPage.rule3')}</p>
                </div>
            </Modal>
        </div>
    );
};

export default CreateEvent;
