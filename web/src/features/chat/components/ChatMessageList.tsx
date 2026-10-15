import { Box, Typography } from '@mui/material';
import type { RefObject } from 'react';
import type { ChatMessage } from '../types/chat';
import { formatMessageText } from '../utils/formatMessageText';

type Props = {
  messages: ChatMessage[];
  pendingUser?: ChatMessage | null;
  streamingText?: string | null;
  isLoading?: boolean;
  isSending?: boolean;
  listRef?: RefObject<HTMLDivElement | null>;
};

const MessageBubble = ({
  content,
  isUser,
}: {
  content: string;
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
      <Typography variant="body2" component="div" sx={{ lineHeight: 1.55 }}>
        {formatMessageText(content)}
      </Typography>
    </Box>
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
              content={message.content}
              isUser={message.sender_type === 'user'}
            />
          ))}
          {pendingUser ? (
            <MessageBubble content={pendingUser.content} isUser />
          ) : null}
          {streamingText != null ? (
            <MessageBubble content={streamingText || '…'} isUser={false} />
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
