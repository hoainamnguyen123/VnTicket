import axios from 'axios';

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

// Interceptor for responses
axiosClient.interceptors.response.use(
    (response) => {
        return response.data; // Only return the data part (ApiResponse format)
    },
    async (error) => {
        const originalConfig = error.config;
        if (error.response && error.response.status === 401 && !originalConfig._retry && originalConfig.url !== '/auth/login') {
            originalConfig._retry = true;
            try {
                // Call raw axios to avoid interceptor loop
                const rs = await axios.post('http://localhost:8080/api/auth/refreshtoken', {}, { withCredentials: true });
                const newToken = rs.data.data.token;

                // Update new token
                localStorage.setItem('token', newToken);
                originalConfig.headers['Authorization'] = `Bearer ${newToken}`;

                // Replay original request
                return axiosClient(originalConfig);
            } catch (_error) {
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
