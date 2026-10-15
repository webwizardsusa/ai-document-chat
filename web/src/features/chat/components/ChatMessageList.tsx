import { Box, Chip, Stack, Typography } from '@mui/material';
import type { RefObject } from 'react';
import type { ChatMessage } from '../types/chat';

type Props = {
  messages: ChatMessage[];
  pendingUser?: ChatMessage | null;
  streamingText?: string | null;
  isLoading?: boolean;
  isSending?: boolean;
  listRef?: RefObject<HTMLDivElement | null>;
};

const MessageBubble = ({
  message,
  isUser,
}: {
  message: Pick<ChatMessage, 'content' | 'sources'>;
  isUser: boolean;
}) => (
  <Box
    sx={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: { xs: '92%', sm: '75%' },
    }}
  >
    <Box
      sx={{
        px: 1.75,
        py: 1.25,
        borderRadius: 2.5,
        bgcolor: isUser ? 'primary.main' : 'grey.100',
        color: isUser ? 'primary.contrastText' : 'text.primary',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
        {message.content}
      </Typography>
    </Box>
    {!isUser && message.sources?.length ? (
      <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 0.75, flexWrap: 'wrap' }}>
        {message.sources.map((source) => (
          <Chip
            key={source.id}
            size="small"
            variant="outlined"
            label={
              source.page_number != null
                ? `${source.document_name} p.${source.page_number}`
                : source.document_name
            }
            sx={{ height: 22, maxWidth: 220 }}
          />
        ))}
      </Stack>
    ) : null}
  </Box>
);

const ChatMessageList = ({
  messages,
  pendingUser,
  streamingText,
  isLoading,
  isSending,
  listRef,
}: Props) => {
  const isEmpty =
    !isLoading && messages.length === 0 && !isSending && !pendingUser && streamingText == null;

  return (
    <Box
      ref={listRef}
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        px: { xs: 2, sm: 3 },
        py: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        ...(isEmpty || isLoading
          ? { alignItems: 'center', justifyContent: 'center' }
          : null),
      }}
    >
      {isLoading ? (
        <Typography color="textSecondary">Loading conversation...</Typography>
      ) : isEmpty ? (
        <Typography color="textSecondary">
          Ask a question about your documents below.
        </Typography>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.sender_type === 'user'}
            />
          ))}
          {pendingUser ? <MessageBubble message={pendingUser} isUser /> : null}
          {streamingText != null ? (
            <MessageBubble
              message={{ content: streamingText || '…', sources: [] }}
              isUser={false}
            />
          ) : isSending ? (
            <Typography variant="body2" color="textSecondary" sx={{ alignSelf: 'flex-start' }}>
              Thinking...
            </Typography>
          ) : null}
        </>
      )}
    </Box>
  );
};

export default ChatMessageList;
