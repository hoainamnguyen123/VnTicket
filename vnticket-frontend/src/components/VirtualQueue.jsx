import React, { useState, useEffect, useContext } from 'react';
import { Spin } from 'antd';
import { ThemeContext } from '../context/ThemeContext';

const VirtualQueue = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { isDark } = useContext(ThemeContext);

    useEffect(() => {
        // Lệnh nghe ngầm từ axiosClient báo hiệu Quá tải 503
        const handleToggleQueue = (event) => {
            setIsVisible(event.detail);
        };

        window.addEventListener('toggle-queue', handleToggleQueue);

        // Hủy đăng ký khi Component bị unmount
        return () => {
            window.removeEventListener('toggle-queue', handleToggleQueue);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            // Đổi nền theo mode, nền Dark Mode của code invert #f4f4f4 là khoảng #0b0b0b
            backgroundColor: isDark ? '#0b0b0b' : '#f4f4f4',
            zIndex: 999999, // Đè lên tất cả Navbar, Button, Modal
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
            {/* Hoạt hình Loading */}
            <img
                src="https://media1.tenor.com/m/AA375QPWlAUAAAAC/loading.gif"
                alt="Loading Queue"
                style={{
                    width: '200px', // Nén nhẹ lại cỡ 200px để không đẩy chữ ra khỏi viền
                    marginBottom: '20px', // Rút ngắn khoảng cách với chữ
                    mixBlendMode: isDark ? 'normal' : 'darken',
                    // Trick ảo ma lật ngược màu của GIF nếu ở Dark Mode, lật luôn hệ màu để giữ chóp
                    filter: isDark ? 'invert(1) hue-rotate(180deg)' : 'none'
                }}
            />

            <h2 style={{
                fontSize: '20px', // Giảm cỡ nhỏ xuống chút
                fontWeight: '600',
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : '#1f2937',
                textAlign: 'center',
                padding: '0 20px',
                maxWidth: '850px',
                lineHeight: '1.6'
            }}>
                Có rất nhiều người tham gia sự kiện và chúng tôi đang xếp hàng cho bạn, vui lòng chờ đợi!<br />
                Không cần làm mới trang, việc xếp hàng sẽ tự động diễn ra
            </h2>

            <div style={{ marginTop: '20px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '10px', color: isDark ? '#9ca3af' : '#6b7280', fontSize: '15px', fontWeight: '500' }}>
                    Hệ thống đang tự động tải lại...
                </div>
            </div>
        </div>
    );
};

export default VirtualQueue;
