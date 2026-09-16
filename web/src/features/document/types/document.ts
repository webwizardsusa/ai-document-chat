export type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export type Document = {
  id: string;
  workspace_id: string;
  original_name: string;
  mime_type: string | null;
  file_size: number | null;
  status: DocumentStatus;
  page_count: number | null;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};
