import type { FC } from 'react';
import { Link } from 'react-router';
import { Box } from '@mui/material';
import { LogoDark } from '@/shared/assets';

type Props = {
  compact?: boolean;
  height?: number;
};

const Logo: FC<Props> = ({ compact = false, height = 70 }) => (
  <Box
    component={Link}
    to="/"
    sx={{
      height,
      width: compact ? 40 : 180,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}
  >
    <LogoDark />
  </Box>
);

export default Logo;
