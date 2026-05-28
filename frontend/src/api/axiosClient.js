import axios from 'axios';

let apiURL = process.env.REACT_APP_API_URL;

if (!apiURL) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Nếu chạy online (Vercel) nhưng chưa cấu hình ENV, tự động trỏ về Render BE
    apiURL = 'https://velvetstore.onrender.com/api';
  } else {
    // Nếu chạy local, trỏ về local BE
    apiURL = 'http://localhost:5000/api';
  }
}

if (apiURL && !apiURL.endsWith('/api') && !apiURL.endsWith('/api/')) {
  apiURL = apiURL.replace(/\/+$/, '') + '/api';
}

const axiosClient = axios.create({
  baseURL: apiURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/dang-nhap') {
        window.location.href = '/dang-nhap';
      }
    }
    return Promise.reject(error.response?.data || { message: 'Đã có lỗi xảy ra' });
  }
);

export default axiosClient;
