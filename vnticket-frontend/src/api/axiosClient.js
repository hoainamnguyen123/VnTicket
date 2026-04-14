import axios from 'axios';
import { Modal } from 'antd';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor for requests
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// State variables for tracking token refresh
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

function onRrefreshed(token) {
    refreshSubscribers.map(cb => cb(token));
}

// Interceptor for responses
axiosClient.interceptors.response.use(
    (response) => {
        return response.data; // Only return the data part (ApiResponse format)
    },
    async (error) => {
        const originalConfig = error.config;

        // --- BẮT SỰ KIỆN TỪ RATE LIMIT FILTER ---
        if (error.response) {
            if (error.response.status === 429) {
                Modal.warning({
                    title: 'Giới hạn Truy cập (429)',
                    content: error.response.data?.message || 'Bạn đang gửi quá nhiều yêu cầu cùng một lúc. Vui lòng chậm lại!',
                    okText: 'Đã hiểu',
                    centered: true
                });
                return Promise.reject(error.response.data);
            }
            if (error.response.status === 503) {
                // 1. Phóng tín hiệu Bật Giao diện Xếp Hàng Ảo (Gấu Panda)
                window.dispatchEvent(new CustomEvent('toggle-queue', { detail: true }));

                // 2. Thuật toán Đệ quy tự động Retry không cần F5
                return new Promise((resolve) => {
                    // Ngủ 3 giây để Server có thời gian xả Request chờ Flash Sale
                    setTimeout(() => {
                        console.log("[VIRTUAL QUEUE] Automatically retrying the request...");
                        resolve(axiosClient(originalConfig)); // Ném Request ngầm lại vào Server
                    }, 3000);
                }).then(res => {
                    // Nếu ở lần gọi sau mà xin được vé thành công -> Mở màn hình tắt chờ đợi!
                    window.dispatchEvent(new CustomEvent('toggle-queue', { detail: false }));
                    return res;
                }).catch(err => {
                    // Thất bại (Ví dụ lại ăn 503) -> Ném xuống cuối tự động lặp lại quy trình này
                    return Promise.reject(err);
                });
            }
        }
        if (error.response && error.response.status === 401 && !originalConfig._retry && originalConfig.url !== '/auth/login') {
            originalConfig._retry = true;

            if (isRefreshing) {
                // Cuộn request này vào hàng đợi nếu đang có 1 request refresh khác đang chạy
                return new Promise(resolve => {
                    subscribeTokenRefresh((token) => {
                        originalConfig.headers['Authorization'] = `Bearer ${token}`;
                        resolve(axiosClient(originalConfig));
                    });
                });
            }

            isRefreshing = true;

            try {
                // Call raw axios to avoid interceptor loop
                const rs = await axios.post('http://localhost:8080/api/auth/refreshtoken', {}, { withCredentials: true });
                const newToken = rs.data.data.token;

                console.log('🔄 Token expired. Transparently refreshed a new Access Token!');

                // Update new token
                localStorage.setItem('token', newToken);
                originalConfig.headers['Authorization'] = `Bearer ${newToken}`;

                // Giải phóng hàng đợi (áp dụng token mới cho các request đang chờ)
                isRefreshing = false;
                onRrefreshed(newToken);
                refreshSubscribers = [];

                // Replay original request
                return axiosClient(originalConfig);
            } catch (_error) {
                isRefreshing = false;
                refreshSubscribers = [];

                // Refresh expired/failed -> force logout
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(_error);
            }
        }
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;
