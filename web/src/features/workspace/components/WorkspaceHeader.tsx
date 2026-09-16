import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import {
  Menu as MenuIcon,
  DescriptionOutlined as DocsIcon,
} from '@mui/icons-material';
import { layoutConfig } from '@/app/providers';
import { useLayout } from '@/app/providers/useLayout';

type Props = {
  title?: string;
  showDocsToggle?: boolean;
};

const WorkspaceHeader = ({ title, showDocsToggle = true }: Props) => {
  const { setIsMobileSidebar, isDocsSidebar, setIsDocsSidebar } = useLayout();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        // Soft brand mist — calm chat chrome that pairs with primary #5D87FF
        background: 'linear-gradient(180deg, #F7F9FF 0%, #EEF3FF 100%)',
        color: 'text.primary',
        borderBottom: '1px solid #E2E8F6',
        boxShadow: '0 1px 0 rgba(93, 135, 255, 0.06)',
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${layoutConfig.topbarHeight}px !important`,
          gap: 1,
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <IconButton
          edge="start"
          onClick={() => setIsMobileSidebar(true)}
          sx={{ display: { lg: 'none' } }}
          aria-label="Open sidebar"
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, fontSize: '1rem', flex: 1, minWidth: 0, color: '#2A3547' }}
          noWrap
        >
          {title || 'Workspace'}
        </Typography>
        {showDocsToggle ? (
          <IconButton
            onClick={() => setIsDocsSidebar(!isDocsSidebar)}
            aria-label={isDocsSidebar ? 'Close documents' : 'Open documents'}
            aria-pressed={isDocsSidebar}
            sx={{
              color: isDocsSidebar ? 'primary.main' : 'text.secondary',
              bgcolor: isDocsSidebar ? 'rgba(93, 135, 255, 0.14)' : 'rgba(255,255,255,0.85)',
              border: '1px solid',
              borderColor: isDocsSidebar ? 'rgba(93, 135, 255, 0.28)' : 'rgba(226, 232, 246, 0.95)',
              '&:hover': {
                bgcolor: isDocsSidebar
                  ? 'rgba(93, 135, 255, 0.2)'
                  : 'rgba(255,255,255,1)',
              },
            }}
          >
            <DocsIcon />
          </IconButton>
        ) : null}
      </Toolbar>
    </AppBar>
  );
};

export default WorkspaceHeader;
