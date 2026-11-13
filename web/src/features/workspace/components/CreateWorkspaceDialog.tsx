import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import { CustomTextField } from '@/shared/components';
import { useCreateWorkspace } from '../hooks';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (workspaceId: string) => void;
};

const CreateWorkspaceDialog = ({ open, onClose, onCreated }: Props) => {
  const { name, setName, isLoading, apiError, canSubmit, handleClose, handleSubmit } =
    useCreateWorkspace({ onClose, onCreated });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create workspace</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <CustomTextField
              autoFocus
              label="Workspace name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(apiError)}
              helperText={apiError || 'Documents and chat will belong to this workspace.'}
              disabled={isLoading}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!canSubmit}>
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateWorkspaceDialog;
