import { Box, Drawer, Typography } from '@mui/material';
import { DescriptionOutlined as BrandIcon } from '@mui/icons-material';
import { layoutConfig } from '@/app/providers';
import { useLayout } from '@/app/providers/useLayout';
import type { Workspace } from '../types/workspace';
import WorkspaceList from './WorkspaceList';
import WorkspaceUserCard from './WorkspaceUserCard';

type Props = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: () => void;
  isLoadingWorkspaces?: boolean;
};

const SidebarContent = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  isLoadingWorkspaces,
}: Props) => (
  <Box
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderRight: (theme) => `1px solid ${theme.palette.divider}`,
    }}
  >
    <Box sx={{ px: 2, pt: 2.25, pb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%' }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BrandIcon sx={{ color: 'common.white', fontSize: 20 }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: '1rem',
            lineHeight: 1.3,
            flex: 1,
            minWidth: 0,
          }}
          noWrap
        >
          AI Document Chat
        </Typography>
      </Box>
    </Box>

    <WorkspaceList
      workspaces={workspaces}
      activeId={activeWorkspaceId}
      onSelect={onSelectWorkspace}
      onCreate={onCreateWorkspace}
      isLoading={isLoadingWorkspaces}
    />

    <WorkspaceUserCard />
  </Box>
);

const WorkspaceSidebar = (props: Props) => {
  const { isMobileSidebar, setIsMobileSidebar } = useLayout();

  return (
    <>
      <Box
        sx={{
          width: layoutConfig.sidebarWidth,
          flexShrink: 0,
          display: { xs: 'none', lg: 'block' },
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <SidebarContent {...props} />
      </Box>

      <Drawer
        open={isMobileSidebar}
        onClose={() => setIsMobileSidebar(false)}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: layoutConfig.sidebarWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <SidebarContent
          {...props}
          onSelectWorkspace={(id) => {
            props.onSelectWorkspace(id);
            setIsMobileSidebar(false);
          }}
        />
      </Drawer>
    </>
  );
};

export default WorkspaceSidebar;
