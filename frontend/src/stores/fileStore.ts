import { create } from 'zustand';

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  uploadTime: Date;
}

export interface ProcessedDocument {
  documentId: string;
  filename: string;
  processResult: any;
  fixes: any[];
}

interface FileState {
  selectedFiles: File[];
  uploadedDocuments: UploadedDocument[];
  processingDocumentId: string | null;
  processedDocuments: ProcessedDocument[];
  currentDocumentIndex: number;

  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  addUploadedDocument: (doc: UploadedDocument) => void;
  updateDocumentStatus: (id: string, status: UploadedDocument['status']) => void;
  setProcessingDocument: (id: string | null) => void;
  addProcessedDocument: (doc: ProcessedDocument) => void;
  clearProcessedDocuments: () => void;
  setCurrentDocumentIndex: (index: number) => void;
}

export const useFileStore = create<FileState>((set) => ({
  selectedFiles: [],
  uploadedDocuments: [],
  processingDocumentId: null,
  processedDocuments: [],
  currentDocumentIndex: 0,

  addFiles: (files) =>
    set((state) => ({
      selectedFiles: [...state.selectedFiles, ...files],
    })),

  removeFile: (index) =>
    set((state) => ({
      selectedFiles: state.selectedFiles.filter((_, i) => i !== index),
    })),

  clearFiles: () => set({ selectedFiles: [] }),

  addUploadedDocument: (doc) =>
    set((state) => ({
      uploadedDocuments: [...state.uploadedDocuments, doc],
    })),

  updateDocumentStatus: (id, status) =>
    set((state) => ({
      uploadedDocuments: state.uploadedDocuments.map((doc) =>
        doc.id === id ? { ...doc, status } : doc,
      ),
    })),

  setProcessingDocument: (id) => set({ processingDocumentId: id }),

  addProcessedDocument: (doc) =>
    set((state) => ({
      processedDocuments: [...state.processedDocuments, doc],
    })),

  clearProcessedDocuments: () => set({ processedDocuments: [], currentDocumentIndex: 0 }),

  setCurrentDocumentIndex: (index) => set({ currentDocumentIndex: index }),
}));
