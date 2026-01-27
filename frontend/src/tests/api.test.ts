/**
 * Frontend API Service Tests
 * Run with: npm test (after configuring vitest)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import axios from 'axios';
import { documentApi, presetApi, historyApi, healthApi, rulesApi } from '../services/api';

describe('Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check health status', async () => {
    const mockResponse = { data: { status: 'ok', version: '1.0.0' } };
    (axios.get as any).mockResolvedValue(mockResponse);

    const result = await healthApi.check();

    expect(result.status).toBe('ok');
    expect(result.version).toBe('1.0.0');
  });
});

describe('Preset API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get all presets', async () => {
    const mockResponse = {
      data: {
        presets: [
          { id: 'academic', name: '学术论文', description: '', rules: [] },
          { id: 'business', name: '企业公文', description: '', rules: [] },
        ],
      },
    };
    (axios.get as any).mockResolvedValue(mockResponse);

    const result = await presetApi.getAll();

    expect(result.presets).toHaveLength(2);
    expect(result.presets[0].id).toBe('academic');
  });

  it('should get preset detail', async () => {
    const mockResponse = {
      data: {
        id: 'academic',
        name: '学术论文',
        description: '',
        rules: { font_standard: { enabled: true } },
      },
    };
    (axios.get as any).mockResolvedValue(mockResponse);

    const result = await presetApi.getDetail('academic');

    expect(result.id).toBe('academic');
    expect(result.rules).toBeDefined();
  });
});

describe('Document API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload document', async () => {
    const mockResponse = {
      data: { document_id: 'doc_123', filename: 'test.docx' },
    };
    (axios.post as any).mockResolvedValue(mockResponse);

    const file = new File(['test'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const result = await documentApi.upload(file);

    expect(result.document_id).toBe('doc_123');
    expect(result.filename).toBe('test.docx');
  });

  it('should process document', async () => {
    const mockResponse = {
      data: {
        document_id: 'doc_123',
        status: 'completed',
        total_fixes: 5,
        fixes: [],
        duration_ms: 150,
      },
    };
    (axios.post as any).mockResolvedValue(mockResponse);

    const result = await documentApi.process({ document_id: 'doc_123', preset: 'academic' });

    expect(result.status).toBe('completed');
    expect(result.total_fixes).toBe(5);
  });

  it('should generate download URL', () => {
    const url = documentApi.getDownloadUrl('doc_123');
    expect(url).toContain('download/doc_123');
  });
});

describe('History API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get history', async () => {
    const mockResponse = {
      data: { history: [] },
    };
    (axios.get as any).mockResolvedValue(mockResponse);

    const result = await historyApi.getAll();

    expect(result.history).toEqual([]);
  });

  it('should add history item', async () => {
    const mockResponse = {
      data: { success: true, id: 'test_123' },
    };
    (axios.post as any).mockResolvedValue(mockResponse);

    const item = {
      id: 'test_123',
      filename: 'test.docx',
      processed_time: '2024-01-01 12:00',
      size: '1.0 MB',
      preset: 'academic',
      fixes: 5,
      status: 'completed' as const,
    };
    const result = await historyApi.add(item);

    expect(result.success).toBe(true);
  });

  it('should delete history item', async () => {
    const mockResponse = {
      data: { success: true },
    };
    (axios.delete as any).mockResolvedValue(mockResponse);

    const result = await historyApi.delete('test_123');

    expect(result.success).toBe(true);
  });
});

describe('Rules API', () => {
  it('should generate export URL', () => {
    const url = rulesApi.exportAll();
    expect(url).toContain('rules/export');
  });

  it('should generate preset export URL', () => {
    const url = rulesApi.exportPreset('academic');
    expect(url).toContain('rules/export/academic');
  });

  it('should import rules', async () => {
    const mockResponse = {
      data: { success: true, imported_count: 1, message: 'Imported 1 presets' },
    };
    (axios.post as any).mockResolvedValue(mockResponse);

    const result = await rulesApi.import('presets:\n  test:\n    rules: {}');

    expect(result.success).toBe(true);
    expect(result.imported_count).toBe(1);
  });
});
