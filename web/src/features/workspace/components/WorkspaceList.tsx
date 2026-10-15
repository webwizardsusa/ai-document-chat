import {
  Box,
  Button,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  FolderOutlined as FolderIcon,
} from '@mui/icons-material';
import type { Workspace } from '../types/workspace';

type Props = {
  workspaces: Workspace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete?: (id: string, name: string) => void;
  deletingId?: string | null;
  isLoading?: boolean;
};

const WorkspaceList = ({
  workspaces,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  deletingId,
  isLoading,
}: Props) => (
  <Box
    sx={{
      px: 2,
      pt: 1,
      pb: 1,
      flex: 1,
      minHeight: 0,
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
    }}
  >
    <Button
      fullWidth
      variant="contained"
      startIcon={<AddIcon />}
      onClick={onCreate}
      sx={{
        justifyContent: 'center',
        py: 1.1,
        borderRadius: 2,
        fontWeight: 600,
        textTransform: 'none',
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      }}
    >
      New workspace
    </Button>

    {isLoading ? (
      <Typography variant="body2" color="textSecondary" sx={{ px: 0.5, py: 1 }}>
        Loading...
      </Typography>
    ) : workspaces.length === 0 ? (
      <Box
        sx={{
          borderRadius: 2,
          border: (theme) => `1px dashed ${theme.palette.divider}`,
          bgcolor: 'grey.50',
          p: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
          No workspaces yet. Create one to upload documents and chat.
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onCreate}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Add workspace
        </Button>
      </Box>
    ) : (
      <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {workspaces.map((workspace) => {
          const selected = workspace.id === activeId;
          const count = workspace.document_count ?? 0;
          return (
            <ListItemButton
              key={workspace.id}
              selected={selected}
              onClick={() => onSelect(workspace.id)}
              sx={{
                borderRadius: 2,
                px: 1.25,
                py: 1,
                pr: onDelete ? 5 : 1.25,
                position: 'relative',
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  '&:hover': { bgcolor: 'primary.light' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <FolderIcon
                  sx={{
                    fontSize: 22,
                    color: selected ? 'primary.main' : 'text.secondary',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={workspace.name}
                secondary={`${count} document${count === 1 ? '' : 's'}`}
                slotProps={{
                  primary: {
                    noWrap: true,
                    sx: {
                      fontWeight: selected ? 600 : 500,
                      fontSize: '0.9rem',
                    },
                  },
                  secondary: {
                    sx: { fontSize: '0.75rem' },
                  },
                }}
              />
              {onDelete ? (
                <IconButton
                  size="small"
                  aria-label={`Delete ${workspace.name}`}
                  disabled={deletingId === workspace.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(workspace.id, workspace.name);
                  }}
                  sx={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'error.main',
                    opacity: selected ? 1 : 0.55,
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              ) : null}
            </ListItemButton>
          );
        })}
      </List>
    )}
  </Box>
);

export default WorkspaceList;
