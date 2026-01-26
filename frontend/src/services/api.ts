import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface UploadResponse {
    document_id: string;
    filename: string;
}

export interface FixItem {
    id: string;
    rule_id: string;
    description: string;
}

export interface ProcessResponse {
    document_id: string;
    status: string;
    total_fixes: number;
    fixes: FixItem[];
    duration_ms: number;
}

export interface ProcessRequest {
    document_id: string;
    preset: string;
}

export const documentApi = {
    /**
     * 上传文档
     */
    upload: async (file: File): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post<UploadResponse>(`${API_BASE}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * 处理文档
     */
    process: async (request: ProcessRequest): Promise<ProcessResponse> => {
        const response = await axios.post<ProcessResponse>(`${API_BASE}/process`, request);
        return response.data;
    },

    /**
     * 获取下载链接
     */
    getDownloadUrl: (documentId: string): string => {
        return `${API_BASE}/download/${documentId}`;
    },
};

const BACKEND_BASE = 'http://127.0.0.1:8000';

export interface PresetInfo {
    id: string;
    name: string;
    description: string;
    rules: string[];
}

export interface PresetDetail {
    id: string;
    name: string;
    description: string;
    rules: Record<string, any>;
}

export const presetApi = {
    /**
     * 获取所有预设列表
     */
    getAll: async (): Promise<PresetInfo[]> => {
        const response = await axios.get<{ presets: PresetInfo[] }>(`${API_BASE}/presets`);
        return response.data.presets;
    },

    /**
     * 获取预设详情
     */
    getDetail: async (presetId: string): Promise<PresetDetail> => {
        const response = await axios.get<PresetDetail>(`${API_BASE}/presets/${presetId}`);
        return response.data;
    },
};

export const healthApi = {
    /**
     * 健康检查
     */
    check: async (): Promise<{ status: string; version: string }> => {
        const response = await axios.get(`${BACKEND_BASE}/health`);
        return response.data;
    },
};
