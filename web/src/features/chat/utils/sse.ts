/** Minimal SSE reader for chat token streams. */

export type SseHandlers = {
  onToken: (text: string) => void;
  onDone: (payload: unknown) => void;
};

export const readSseStream = async (
  response: Response,
  handlers: SseHandlers,
): Promise<{ ok: true } | { ok: false; message: string }> => {
  if (!response.body) {
    return { ok: false, message: 'Empty stream response' };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;
  let errorMessage: string | null = null;

  const flushBlock = (block: string) => {
    const lines = block.split('\n');
    const dataLines: string[] = [];
    let event = 'message';

    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (!dataLines.length) return;

    let data: unknown = dataLines.join('\n');
    try {
      data = JSON.parse(data as string);
    } catch {
      // keep raw string
    }

    if (event === 'token') {
      const text =
        data && typeof data === 'object' && 'text' in data
          ? String((data as { text: unknown }).text ?? '')
          : '';
      if (text) handlers.onToken(text);
      return;
    }
    if (event === 'done') {
      finished = true;
      handlers.onDone(data);
      return;
    }
    if (event === 'error') {
      errorMessage =
        data && typeof data === 'object' && 'message' in data
          ? String((data as { message: unknown }).message)
          : 'Stream failed';
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      if (part.trim()) flushBlock(part);
    }
    if (errorMessage) break;
  }
  if (!errorMessage && buffer.trim()) flushBlock(buffer);

  if (errorMessage) return { ok: false, message: errorMessage };
  if (!finished) return { ok: false, message: 'Stream ended before the answer completed' };
  return { ok: true };
};
