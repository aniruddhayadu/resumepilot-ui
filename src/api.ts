import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080', 
});

// Request interceptor
api.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
});

export default api;