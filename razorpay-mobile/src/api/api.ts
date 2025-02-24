import axios from "axios";

const BASE_URL = "http://192.168.1.15:3000"; // Android Emulator

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Optional: 10s timeout
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    console.log("Request:", config.url, config);
    return config;
  },
  (error) => {
    console.error("Request Error:", error.config.url, error.message);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    console.log("Response:", response.config.url, response);
    return response;
  },
  (error) => {
    console.error("Response Error:", error.config.url, error);
    return Promise.reject(error);
  }
);

export default api;
