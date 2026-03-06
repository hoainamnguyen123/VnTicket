import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api',
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
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized error
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Can add redirect to login here if necessary, but usually handled in UI
        }
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;
