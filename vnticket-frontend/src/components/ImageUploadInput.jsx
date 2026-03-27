import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

const ImageUploadInput = ({ value, onChange, aspectRatio, isBanner }) => {
    const [loading, setLoading] = useState(false);

    const customRequest = async ({ file, onSuccess, onError }) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axiosClient.post('/v1/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // axiosClient returns response.data directly
            const imageUrl = response.url;
            if (onChange) {
                onChange(imageUrl);
            }
            onSuccess("ok");
            message.success('Tải ảnh thành công!');
        } catch (error) {
            console.error('Lỗi khi tải ảnh:', error);
            onError(error);
            message.error('Tải ảnh thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const uploadButton = (
        <div>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
        </div>
    );

    return (
        <div className={`custom-image-upload ${isBanner ? 'banner-upload' : 'extra-upload'}`} style={isBanner ? { width: '100%', aspectRatio: aspectRatio || '16/9', position: 'relative', overflow: 'hidden' } : {}}>
            <style>{`
                .custom-image-upload.banner-upload > span,
                .custom-image-upload.banner-upload .ant-upload-wrapper,
                .custom-image-upload.banner-upload .ant-upload-wrapper .ant-upload-select {
                    position: absolute !important;
                    top: 0; left: 0; right: 0; bottom: 0;
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    background-color: transparent !important;
                    border-radius: 12px;
                    border: 2px dashed var(--ant-color-border, #d9d9d9);
                    transition: border-color 0.3s;
                }
                .custom-image-upload.extra-upload .ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload.ant-upload-select {
                    background-color: transparent !important;
                }
                .custom-image-upload.banner-upload .ant-upload-wrapper.ant-upload-picture-card-wrapper .ant-upload.ant-upload-select:hover {
                    border-color: var(--ant-color-primary, #1677ff);
                }
            `}</style>
            <Upload
                name="file"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                customRequest={customRequest}
                accept="image/*"
            >
                {value ? (
                    <img
                        src={value}
                        alt="preview"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '10px'
                        }}
                    />
                ) : (
                    uploadButton
                )}
            </Upload>
        </div>
    );
};

export default ImageUploadInput;
