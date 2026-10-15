import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { toast } from 'react-toastify';
import { authedFetch } from '@/app/api/authedFetch';
import { useAppDispatch } from '@/app/store';
import { getErrorMessage, readResponseError } from '@/shared/utils';
import {
  chatApi,
  messageStreamPath,
  useClearMessagesMutation,
  useGetMessagesQuery,
} from '../api/chatApi';
import type { AskMessageResponse, ChatMessage } from '../types/chat';
import { readSseStream } from '../utils/sse';

type Options = {
  workspaceId: string | null | undefined;
  enabled?: boolean;
};

export const useWorkspaceChat = ({ workspaceId, enabled = true }: Options) => {
  const dispatch = useAppDispatch();
  const skip = !workspaceId || !enabled;
  const {
    data: messages = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetMessagesQuery(workspaceId ?? '', { skip });

  const [clearMessages, { isLoading: isClearing }] = useClearMessagesMutation();
  const [draft, setDraft] = useState('');
  const [draftWorkspaceId, setDraftWorkspaceId] = useState(workspaceId);
  const [isSending, setIsSending] = useState(false);
  const [pendingUser, setPendingUser] = useState<ChatMessage | null>(null);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset composer when switching workspaces (render-time sync).
  if (workspaceId !== draftWorkspaceId) {
    setDraftWorkspaceId(workspaceId);
    setDraft('');
    setPendingUser(null);
    setStreamingText(null);
  }

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isSending, streamingText, pendingUser]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const canSend = Boolean(enabled && workspaceId && draft.trim() && !isSending);

  const resetPending = () => {
    setPendingUser(null);
    setStreamingText(null);
  };

  const send = async () => {
    if (!workspaceId || !canSend) return;
    const content = draft.trim();
    setDraft('');
    setIsSending(true);
    setPendingUser({
      id: `temp-user-${Date.now()}`,
      workspace_id: workspaceId,
      sender_type: 'user',
      content,
      created_at: new Date().toISOString(),
      sources: [],
    });
    setStreamingText('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await authedFetch(messageStreamPath(workspaceId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(await readResponseError(response, 'Failed to send message'));
      }

      const result = await readSseStream(response, {
        onToken: (text) => setStreamingText((prev) => (prev ?? '') + text),
        onDone: (payload) => {
          const data = payload as AskMessageResponse;
          dispatch(
            chatApi.util.updateQueryData('getMessages', workspaceId, (draftMessages) => {
              draftMessages.push(data.user_message, data.assistant_message);
            }),
          );
          resetPending();
        },
      });

      if (!result.ok) throw new Error(result.message);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setDraft(content);
      resetPending();
      toast.error(getErrorMessage(err, 'Failed to send message'));
    } finally {
      setIsSending(false);
      abortRef.current = null;
    }
  };

  const onClearHistory = async () => {
    if (!workspaceId) return;
    if (!window.confirm('Clear all chat messages in this workspace?')) return;
    try {
      await clearMessages(workspaceId).unwrap();
      resetPending();
      toast.success('Chat history cleared');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to clear chat'));
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return {
    messages,
    pendingUser,
    streamingText,
    isLoading: Boolean(isLoading && messages.length === 0),
    isFetching,
    isError,
    isSending,
    isClearing,
    draft,
    setDraft,
    canSend,
    listRef,
    onSubmit,
    onComposerKeyDown,
    onClearHistory,
    refetchMessages: () => {
      void refetch();
    },
  };
};
