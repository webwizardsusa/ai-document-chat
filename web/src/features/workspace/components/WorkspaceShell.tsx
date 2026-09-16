import { Box } from '@mui/material';
import { Outlet } from 'react-router';
import { Spinner } from '@/shared/components';
import { useWorkspaceShell } from '../hooks';
import CreateWorkspaceDialog from './CreateWorkspaceDialog';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceSidebar from './WorkspaceSidebar';

const WorkspaceShell = () => {
  const {
    workspaces,
    activeWorkspace,
    isBootstrapping,
    isLoadingWorkspaces,
    createOpen,
    openCreateWorkspace,
    closeCreateWorkspace,
    selectWorkspace,
    onWorkspaceCreated,
    outletContext,
  } = useWorkspaceShell();

  if (isBootstrapping) {
    return <Spinner />;
  }

  return (
    <>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
        <WorkspaceSidebar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspace?.id ?? null}
          onSelectWorkspace={selectWorkspace}
          onCreateWorkspace={openCreateWorkspace}
          isLoadingWorkspaces={isLoadingWorkspaces}
        />
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <WorkspaceHeader title={activeWorkspace?.name} />
          <Box
            component="main"
            sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          >
            <Outlet context={outletContext} />
          </Box>
        </Box>
      </Box>

      <CreateWorkspaceDialog
        open={createOpen}
        onClose={closeCreateWorkspace}
        onCreated={onWorkspaceCreated}
      />
    </>
  );
};

export default WorkspaceShell;
