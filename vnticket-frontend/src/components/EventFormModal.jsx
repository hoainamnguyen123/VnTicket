import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, Space, Button, Alert } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;

const EventFormModal = ({ visible, onCancel, onOk, form, title, editingEvent, isUser }) => {
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
            width={800}
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
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="type" label="Loại Sự Kiện" rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập loại!' }]}>
                            <Select placeholder="Chọn loại sự kiện">
                                <Option value="Âm nhạc">Âm nhạc</Option>
                                <Option value="Thể thao">Thể thao</Option>
                                <Option value="Hội thảo">Hội thảo</Option>
                                <Option value="Khác">Khác</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="startTime" label="Thời Gian" rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}>
                            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="imageUrl" label="Link Ảnh Chính (URL)" rules={[{ required: true, message: 'Vui lòng nhập link ảnh!' }]}>
                    <Input />
                </Form.Item>

                <Form.List name="additionalImages">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map((field, index) => (
                                <Form.Item
                                    required={false}
                                    key={field.key}
                                    label={index === 0 ? "Ảnh Phụ Thêm (URL)" : ""}
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
                                            <Input placeholder="URL ảnh phụ" style={{ width: '100%' }} />
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
                <Row gutter={16}>
                    <Col span={8}>
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
                    <Col span={8}>
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
                    <Col span={8}>
                        <Form.Item name="detailAddress" label="Địa chỉ chi tiết" rules={[{ required: true, message: 'Nhập số nhà/tên đường!' }]}>
                            <Input placeholder="Số nhà, đường..." />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="description" label="Mô Tả Sự Kiện">
                    <TextArea rows={4} />
                </Form.Item>

                {!editingEvent && (
                    <>
                        <h3>Các Loại Vé (Khu Vực)</h3>
                        <Form.List name="ticketTypes">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'zoneName']}
                                                rules={[{ required: true, message: 'Nhập tên' }]}
                                            >
                                                <Input placeholder="Khu vực (VD: VIP)" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'price']}
                                                rules={[{ required: true, message: 'Nhập giá' }]}
                                            >
                                                <Input type="number" placeholder="Giá vé" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'totalQuantity']}
                                                rules={[{ required: true, message: 'Nhập SL' }]}
                                            >
                                                <Input type="number" placeholder="Tổng số lượng" />
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                                        </Space>
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
