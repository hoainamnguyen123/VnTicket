import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, Space, Button, Alert, Switch, Grid } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import ImageUploadInput from './ImageUploadInput';

const { Option } = Select;
const { TextArea } = Input;

const EventFormModal = ({ visible, onCancel, onOk, form, title, editingEvent, isUser }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);

    useEffect(() => {
        if (visible) {
            axios.get('https://provinces.open-api.vn/api/v2/p/')
                .then(res => setProvinces(res.data))
                .catch(err => console.error("Lỗi khi tải tỉnh thành:", err));
        }
    }, [visible]);

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

    return (
        <Modal
            title={title}
            open={visible}
            onOk={onOk}
            onCancel={onCancel}
            okText={isUser ? "Gửi Yêu Cầu" : "Lưu"}
            cancelText="Hủy"
            width={isMobile ? '95%' : 800}
            style={{ top: isMobile ? 10 : 20 }}
            bodyStyle={{ 
                maxHeight: isMobile ? 'calc(100vh - 180px)' : '75vh', 
                overflowY: 'auto',
                paddingBottom: isMobile ? 80 : 0 
            }}
            maskClosable={false}
            centered={isMobile ? false : true}
            footer={[
                <div key="footer-actions" style={{ 
                    padding: isMobile ? '0 8px 24px' : '0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px'
                }}>
                    <Button onClick={onCancel}>Hủy</Button>
                    <Button type="primary" onClick={onOk}>
                        {isUser ? "Gửi Yêu Cầu" : "Lưu"}
                    </Button>
                </div>
            ]}
        >
            {isUser && !editingEvent && (
                <Alert
                    message="Lưu ý về phí nền tảng"
                    description="Chúng tôi sẽ thu 2% phí (hoa hồng) trên tổng doanh thu bán vé của biểu mẫu sự kiện này."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}
            <Form form={form} layout="vertical">
                <Form.Item name="name" label="Tên Sự Kiện" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="organizerName" label="Tên Ban Tổ Chức" rules={[{ required: true, message: 'Vui lòng nhập tên ban tổ chức!' }]}>
                    <Input placeholder="VD: Công ty TNHH Sự Kiện ABC" />
                </Form.Item>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="type" label="Loại Sự Kiện" rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập loại!' }]}>
                            <Select placeholder="Chọn loại sự kiện">
                                <Option value="Âm nhạc">Âm nhạc</Option>
                                <Option value="Thể thao">Thể thao</Option>
                                <Option value="Hội thảo">Hội thảo</Option>
                                <Option value="Tham quan, Trải nghiệm">Tham quan, Trải nghiệm</Option>
                                <Option value="Sân khấu, Nghệ thuật">Sân khấu, Nghệ thuật</Option>
                                <Option value="Khác">Khác</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="startTime" label="Thời Gian" rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}>
                            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="imageUrl" label="Ảnh Chính (1280x720)" rules={[{ required: true, message: 'Vui lòng tải ảnh lên!' }]}>
                    <ImageUploadInput />
                </Form.Item>

                <Form.List name="additionalImages">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map((field, index) => (
                                <Form.Item
                                    required={false}
                                    key={field.key}
                                    label={index === 0 ? "Ảnh Phụ Thêm" : ""}
                                >
                                    <Space style={{ display: 'flex' }} align="baseline">
                                        <Form.Item
                                            {...field}
                                            validateTrigger={['onChange', 'onBlur']}
                                            rules={[
                                                { required: true, whitespace: true, message: "Nhập URL ảnh hoặc xóa đi." },
                                            ]}
                                            noStyle
                                        >
                                            <ImageUploadInput />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(field.name)} style={{ color: 'red' }} />
                                    </Space>
                                </Form.Item>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Thêm Ảnh Phụ (Khu vực ghế, sân khấu, v.v)
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <h3>Địa Chỉ tổ chức sự kiện</h3>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <Form.Item name="province" label="Tỉnh/Thành phố" rules={[{ required: true, message: 'Chọn Tỉnh/Thành!' }]}>
                            <Select
                                showSearch
                                placeholder="Tỉnh/Thành"
                                optionFilterProp="children"
                                onChange={handleProvinceChange}
                                filterOption={(input, option) =>
                                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {provinces.map(prov => (
                                    <Option key={prov.code} value={prov.name}>{prov.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item name="ward" label="Phường/Xã" rules={[{ required: true, message: 'Chọn Phường/Xã!' }]}>
                            <Select
                                showSearch
                                placeholder="Phường/Xã"
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {wards.map(w => (
                                    <Option key={w.code} value={w.name}>{w.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item name="detailAddress" label="Địa chỉ chi tiết" rules={[{ required: true, message: 'Nhập số nhà/tên đường!' }]}>
                            <Input placeholder="Số nhà, đường..." />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="description" label="Mô Tả Sự Kiện">
                    <TextArea rows={4} />
                </Form.Item>

                {!isUser && (
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="isSlider" label="Hiển thị trên Slider chính" valuePropName="checked">
                                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="isFeatured" label="Đánh dấu Sự Kiện Nổi Bật" valuePropName="checked">
                                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                            </Form.Item>
                        </Col>
                    </Row>
                )}

                {!editingEvent && (
                    <>
                        <h3>Các Loại Vé (Khu Vực)</h3>
                        <Form.List name="ticketTypes">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} style={{ 
                                            padding: isMobile ? '12px' : '0', 
                                            background: isMobile ? '#f5f5f5' : 'transparent',
                                            borderRadius: isMobile ? '8px' : '0',
                                            marginBottom: 16
                                        }}>
                                            <Row gutter={[8, 8]} align="middle">
                                                <Col xs={24} sm={8}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'zoneName']}
                                                        rules={[{ required: true, message: 'Nhập tên' }]}
                                                        noStyle={!isMobile}
                                                        label={isMobile ? "Tên khu vực" : ""}
                                                    >
                                                        <Input placeholder="Khu vực (VD: VIP)" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={11} sm={7}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'price']}
                                                        rules={[{ required: true, message: 'Nhập giá' }]}
                                                        noStyle={!isMobile}
                                                        label={isMobile ? "Giá vé" : ""}
                                                    >
                                                        <Input type="number" placeholder="Giá vé" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={11} sm={7}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'totalQuantity']}
                                                        rules={[{ required: true, message: 'Nhập SL' }]}
                                                        noStyle={!isMobile}
                                                        label={isMobile ? "Số lượng" : ""}
                                                    >
                                                        <Input type="number" placeholder="Tổng số lượng" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={2} sm={2} style={{ textAlign: 'right' }}>
                                                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', fontSize: '20px' }} />
                                                </Col>
                                            </Row>
                                        </div>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            Thêm Hạng Vé
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </>
                )
                }
            </Form >
        </Modal >
    );
};

export default EventFormModal;
