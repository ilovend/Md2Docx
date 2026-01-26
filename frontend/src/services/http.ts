import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

// 定义标准 API 响应结构
export interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

class HttpClient {
    private instance: AxiosInstance;

    constructor() {
        this.instance = axios.create({
            baseURL: BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // 请求拦截器
        this.instance.interceptors.request.use(
            (config) => {
                // 在这里可以添加 Token
                // const token = useAuthStore.getState().token;
                // if (token) config.headers.Authorization = `Bearer ${token}`;
                return config;
            },
            (error) => Promise.reject(error)
        );

        // 响应拦截器
        this.instance.interceptors.response.use(
            (response: AxiosResponse<ApiResponse>) => {
                const { code, message, data } = response.data;

                // 假设 200 为成功码
                if (code === 200) {
                    return data as any;
                } else {
                    // 业务逻辑错误
                    this.handleError(message || 'Unknown Error');
                    return Promise.reject(new Error(message));
                }
            },
            (error) => {
                let message = 'Network Error';
                if (error.response) {
                    switch (error.response.status) {
                        case 401:
                            message = 'Unauthorized';
                            break;
                        case 403:
                            message = 'Forbidden';
                            break;
                        case 404:
                            message = 'Resource Not Found';
                            break;
                        case 500:
                            message = 'Server Error';
                            break;
                        default:
                            message = error.message;
                    }
                }
                this.handleError(message);
                return Promise.reject(error);
            }
        );
    }

    private handleError(message: string) {
        console.error('[API Error]', message);
        // 此处可集成 Toast 组件
        // toast.error(message);
    }

    public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.get(url, config);
    }

    public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.post(url, data, config);
    }

    public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.put(url, data, config);
    }

    public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.instance.delete(url, config);
    }
}

export const http = new HttpClient();
export default http;
