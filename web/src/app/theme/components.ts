import type { Components, Theme } from '@mui/material/styles';

const components = (theme: Theme): Components<Theme> =>
  ({
  MuiCssBaseline: {
    styleOverrides: {
      '*': { boxSizing: 'border-box' },
      html: { height: '100%', width: '100%' },
      a: { textDecoration: 'none' },
      body: { height: '100%', margin: 0, padding: 0 },
      '#root': { height: '100%' },
      '.MuiCardHeader-action': { alignSelf: 'center !important' },
      '.scrollbar-container': { borderRight: '0 !important' },
      '.MuiAlert-root .MuiAlert-icon': { color: 'inherit!important' },
      ' .simplebar-scrollbar:before': {
        background: `${theme.palette.grey[300]} !important`,
      },
      '@keyframes gradient': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.main,
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        boxShadow: 'none',
      },
      text: {
        padding: '5px 15px',
        '&:hover': {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.main,
        },
      },
      textPrimary: {
        backgroundColor: theme.palette.primary.light,
        '&:hover': {
          backgroundColor: theme.palette.primary.main,
          color: 'white',
        },
      },
      outlinedPrimary: {
        '&:hover': {
          backgroundColor: theme.palette.primary.main,
          color: 'white',
        },
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: { padding: '16px 24px' },
      title: { fontSize: '1.125rem' },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        width: '100%',
        padding: '15px',
        backgroundImage: 'none',
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: { padding: '24px' },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: { borderColor: theme.palette.divider },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { fontWeight: 600, fontSize: '0.75rem' },
    },
  },
  MuiAlert: {
    styleOverrides: {
      standardSuccess: {
        backgroundColor: theme.palette.success.light,
        color: theme.palette.success.main,
      },
      standardError: {
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.main,
      },
      standardWarning: {
        backgroundColor: theme.palette.warning.light,
        color: theme.palette.warning.main,
      },
      standardInfo: {
        backgroundColor: theme.palette.info.light,
        color: theme.palette.info.main,
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.grey[300],
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline, &:hover .MuiOutlinedInput-notchedOutline':
          {
            borderColor: theme.palette.primary.main,
          },
      },
      input: { padding: '12px 14px' },
      inputSizeSmall: { padding: '8px 14px' },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        color: theme.palette.background.paper,
        background: theme.palette.text.primary,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: { borderColor: theme.palette.divider },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: { fontSize: '1.25rem' },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        boxShadow:
          'rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px',
      },
    },
  },
  }) as Components<Theme>;

export default components;
