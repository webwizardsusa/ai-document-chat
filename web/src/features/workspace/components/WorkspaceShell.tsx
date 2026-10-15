import { Box, Button, Typography } from '@mui/material';
import { Outlet } from 'react-router';
import { Spinner } from '@/shared/components';
import { useDeleteWorkspace, useWorkspaceShell } from '../hooks';
import CreateWorkspaceDialog from './CreateWorkspaceDialog';
import WorkspaceDocsSidebar from './WorkspaceDocsSidebar';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceSidebar from './WorkspaceSidebar';

const WorkspaceShell = () => {
  const {
    workspaces,
    activeWorkspace,
    isBootstrapping,
    isLoadingWorkspaces,
    isWorkspacesError,
    refetchWorkspaces,
    createOpen,
    openCreateWorkspace,
    closeCreateWorkspace,
    selectWorkspace,
    onWorkspaceCreated,
    outletContext,
  } = useWorkspaceShell();
  const { deletingId, onDelete } = useDeleteWorkspace({ workspaces });

  if (isBootstrapping) {
    return <Spinner />;
  }

  if (isWorkspacesError && workspaces.length === 0) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Couldn’t load workspaces
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            Check your connection and try again.
          </Typography>
          <Button variant="contained" onClick={refetchWorkspaces}>
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
        <WorkspaceSidebar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspace?.id ?? null}
          onSelectWorkspace={selectWorkspace}
          onCreateWorkspace={openCreateWorkspace}
          onDeleteWorkspace={(id, name) => void onDelete(id, name)}
          deletingWorkspaceId={deletingId}
          isLoadingWorkspaces={isLoadingWorkspaces}
        />
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <WorkspaceHeader
            title={activeWorkspace?.name}
            showDocsToggle={Boolean(activeWorkspace)}
          />
          <Box
            component="main"
            sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          >
            <Outlet context={outletContext} />
          </Box>
        </Box>
      </Box>

      <WorkspaceDocsSidebar workspaceId={activeWorkspace?.id ?? null} />

      <CreateWorkspaceDialog
        open={createOpen}
        onClose={closeCreateWorkspace}
        onCreated={onWorkspaceCreated}
      />
    </>
  );
};

export default WorkspaceShell;
