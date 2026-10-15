import { Box, Button, TextField, Typography } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import type { FormEvent, KeyboardEvent } from 'react';

const INPUT_HEIGHT = 44;

type Props = {
  draft: string;
  setDraft: (value: string) => void;
  canSend: boolean;
  isSending: boolean;
  disabled?: boolean;
  placeholder?: string;
  onSubmit: (event: FormEvent) => void;
  onComposerKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

const ChatComposer = ({
  draft,
  setDraft,
  canSend,
  isSending,
  disabled,
  placeholder,
  onSubmit,
  onComposerKeyDown,
}: Props) => (
  <Box
    component="form"
    onSubmit={onSubmit}
    sx={{
      flexShrink: 0,
      mt: 'auto',
      borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      p: { xs: 1.5, sm: 2 },
      bgcolor: '#FFFFFF',
      width: '100%',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        width: '100%',
      }}
    >
      <TextField
        fullWidth
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onComposerKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSending}
        size="small"
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': {
            height: INPUT_HEIGHT,
            borderRadius: 2,
            bgcolor: '#FFFFFF',
            alignItems: 'center',
          },
          '& .MuiOutlinedInput-input': {
            py: 0,
            height: INPUT_HEIGHT,
            boxSizing: 'border-box',
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={!canSend}
        aria-label="Send"
        sx={{
          flexShrink: 0,
          minWidth: INPUT_HEIGHT,
          width: INPUT_HEIGHT,
          height: INPUT_HEIGHT,
          p: 0,
          borderRadius: 2,
        }}
      >
        <SendIcon fontSize="small" />
      </Button>
    </Box>
    <Typography
      variant="caption"
      color="textSecondary"
      sx={{ display: 'block', textAlign: 'center', mt: 1 }}
    >
      AI responses are generated from your workspace documents and may not always be 100% accurate.
    </Typography>
  </Box>
);

export default ChatComposer;
