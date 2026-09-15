import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type Props = {
  htmlFor?: string;
  required?: boolean;
  children?: ReactNode;
  sx?: object;
  className?: string;
};

const LabelRoot = styled(Typography)(() => ({
  marginBottom: '5px',
  marginTop: '25px',
  display: 'block',
  fontWeight: 600,
})) as typeof Typography;

const CustomFormLabel = ({ htmlFor, required = false, children, sx, className }: Props) => {
  return (
    <LabelRoot
      variant="subtitle1"
      component="label"
      htmlFor={htmlFor}
      className={className}
      sx={sx}
    >
      {children}
      {required ? (
        <Box component="span" sx={{ color: 'error.main', ml: 0.25 }}>
          *
        </Box>
      ) : null}
    </LabelRoot>
  );
};

export default CustomFormLabel;
