export type SenderType = 'user' | 'assistant';

export type MessageSource = {
  id: string;
  document_chunk_id: string;
  document_id: string;
  document_name: string;
  page_number: number | null;
  excerpt: string | null;
  relevance_score: number | null;
  rank: number | null;
};

export type ChatMessage = {
  id: string;
  workspace_id: string;
  sender_type: SenderType;
  content: string;
  created_at: string;
  sources: MessageSource[];
};

export type AskMessageRequest = {
  content: string;
};

export type AskMessageResponse = {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
};
