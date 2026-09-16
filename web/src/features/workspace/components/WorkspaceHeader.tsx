import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { layoutConfig } from '@/app/providers';
import { useLayout } from '@/app/providers/useLayout';

type Props = {
  title?: string;
};

const WorkspaceHeader = ({ title }: Props) => {
  const { setIsMobileSidebar } = useLayout();

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      <Toolbar sx={{ minHeight: `${layoutConfig.topbarHeight}px !important`, gap: 1 }}>
        <IconButton
          edge="start"
          onClick={() => setIsMobileSidebar(true)}
          sx={{ display: { lg: 'none' } }}
          aria-label="Open sidebar"
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }} noWrap>
          {title || 'Workspace'}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default WorkspaceHeader;
