import { Box, Stack, Typography } from '@mui/material';
import { DescriptionOutlined as DocIcon } from '@mui/icons-material';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: ReactNode;
  action?: ReactNode;
};

/** Centered empty / status block used on the workspace chat page. */
const WorkspaceEmptyState = ({ title, description, action }: Props) => (
  <Stack
    spacing={2}
    sx={{
      maxWidth: 480,
      width: '100%',
      textAlign: 'center',
      alignItems: 'center',
    }}
  >
    <Box
      sx={{
        width: 64,
        height: 64,
        borderRadius: 2,
        bgcolor: 'primary.light',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <DocIcon color="primary" sx={{ fontSize: 32 }} />
    </Box>
    <Typography variant="h5" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    <Typography color="textSecondary">{description}</Typography>
    {action ? <Box sx={{ pt: 0.5 }}>{action}</Box> : null}
  </Stack>
);

export default WorkspaceEmptyState;
