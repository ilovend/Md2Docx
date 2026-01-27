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

  /**
   * 获取文档预览HTML
   */
  getPreviewHtml: async (documentId: string, type: 'original' | 'fixed'): Promise<string> => {
    try {
      const response = await axios.get(`${API_BASE}/preview/${documentId}`, {
        params: { type },
        responseType: 'text', // Important: we expect HTML string
      });
      return response.data;
    } catch (error) {
      console.error('Preview fetch failed:', error);
      return '<div class="p-4 text-red-500">Failed to load preview</div>';
    }
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
  getAll: async (): Promise<{ presets: PresetInfo[] }> => {
    const response = await axios.get<{ presets: PresetInfo[] }>(`${API_BASE}/presets`);
    return response.data;
  },

  /**
   * 获取预设详情
   */
  getDetail: async (presetId: string): Promise<PresetDetail> => {
    const response = await axios.get<PresetDetail>(`${API_BASE}/presets/${presetId}`);
    return response.data;
  },

  /**
   * 更新预设
   */
  update: async (
    presetId: string,
    data: Partial<PresetDetail>,
  ): Promise<{ success: boolean; preset: PresetDetail }> => {
    const response = await axios.put<{ success: boolean; preset: PresetDetail }>(
      `${API_BASE}/presets/${presetId}`,
      data,
    );
    return response.data;
  },
};

// History types
export interface HistoryItem {
  id: string;
  filename: string;
  processed_time: string;
  size: string;
  preset: string;
  fixes: number;
  status: 'completed' | 'error';
  document_id?: string;
}

// History API
export const historyApi = {
  getAll: async (): Promise<{ history: HistoryItem[] }> => {
    const response = await axios.get<{ history: HistoryItem[] }>(`${API_BASE}/history`);
    return response.data;
  },

  add: async (item: HistoryItem): Promise<{ success: boolean; id: string }> => {
    const response = await axios.post<{ success: boolean; id: string }>(
      `${API_BASE}/history`,
      item,
    );
    return response.data;
  },

  delete: async (itemId: string): Promise<{ success: boolean }> => {
    const response = await axios.delete<{ success: boolean }>(`${API_BASE}/history/${itemId}`);
    return response.data;
  },

  clear: async (): Promise<{ success: boolean }> => {
    const response = await axios.delete<{ success: boolean }>(`${API_BASE}/history`);
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

// Rules Import/Export API
// Batch Processing Types
export interface BatchItem {
  document_id: string;
  preset?: string;
}

export interface BatchItemResult {
  document_id: string;
  status: string;
  total_fixes: number;
  error?: string;
}

export interface BatchResponse {
  batch_id: string;
  status: string;
  total: number;
  completed: number;
  failed: number;
  results: BatchItemResult[];
}

// Batch Processing API
export const batchApi = {
  start: async (items: BatchItem[]): Promise<BatchResponse> => {
    const response = await axios.post<BatchResponse>(`${API_BASE}/batch/start`, { items });
    return response.data;
  },

  getStatus: async (batchId: string): Promise<BatchResponse> => {
    const response = await axios.get<BatchResponse>(`${API_BASE}/batch/${batchId}`);
    return response.data;
  },

  getDownloadUrl: (batchId: string): string => {
    return `${API_BASE}/batch/${batchId}/download`;
  },

  downloadZip: async (documentIds: string[]): Promise<Blob> => {
    const response = await axios.post(
      `${API_BASE}/batch/zip`,
      { document_ids: documentIds },
      { responseType: 'blob' },
    );
    return response.data;
  },
};

export const rulesApi = {
  exportAll: (): string => {
    return `${API_BASE}/rules/export`;
  },

  exportPreset: (presetId: string): string => {
    return `${API_BASE}/rules/export/${presetId}`;
  },

  import: async (
    yamlContent: string,
  ): Promise<{ success: boolean; imported_count: number; message: string }> => {
    const response = await axios.post(`${API_BASE}/rules/import`, { yaml_content: yamlContent });
    return response.data;
  },
};
