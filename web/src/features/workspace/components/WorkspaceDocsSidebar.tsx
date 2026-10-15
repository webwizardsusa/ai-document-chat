import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  DeleteOutlined as DeleteIcon,
  DescriptionOutlined as DocIcon,
  DownloadOutlined as DownloadIcon,
} from '@mui/icons-material';
import { layoutConfig } from '@/app/providers';
import { useLayout } from '@/app/providers/useLayout';
import UploadDocumentButton from '@/features/document/components/UploadDocumentButton';
import {
  documentStatusColor,
  useDeleteDocument,
  useDownloadDocument,
  useWorkspaceDocuments,
} from '@/features/document/hooks';
import { formatFileSize } from '@/features/document/utils/formatFileSize';

type Props = {
  workspaceId: string | null;
};

const DocsPanelContent = ({ workspaceId }: { workspaceId: string }) => {
  const { documents, isLoading, isError, isEmpty, refetch } =
    useWorkspaceDocuments(workspaceId);
  const { deletingId, onDelete } = useDeleteDocument({ workspaceId });
  const { onDownload } = useDownloadDocument({ workspaceId });

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.75,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
          Documents
        </Typography>
        <UploadDocumentButton
          workspaceId={workspaceId}
          variant="outlined"
          size="small"
          label="Upload"
        />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
        {isLoading ? (
          <Typography variant="body2" color="textSecondary">
            Loading documents...
          </Typography>
        ) : isError ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
              Failed to load documents
            </Typography>
            <Button size="small" variant="outlined" onClick={() => void refetch()}>
              Retry
            </Button>
          </Box>
        ) : isEmpty ? (
          <Box
            sx={{
              borderRadius: 2,
              border: (theme) => `1px dashed ${theme.palette.grey[300]}`,
              bgcolor: 'grey.50',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.25,
              p: 2.5,
              textAlign: 'center',
            }}
          >
            <DocIcon sx={{ color: 'grey.400', fontSize: 32 }} />
            <Typography variant="body2" color="textSecondary">
              No documents uploaded yet
            </Typography>
            <UploadDocumentButton
              workspaceId={workspaceId}
              variant="contained"
              size="small"
              label="Upload document"
            />
          </Box>
        ) : (
          <List disablePadding>
            {documents.map((doc) => (
              <ListItem
                key={doc.id}
                sx={{
                  px: 1,
                  py: 1,
                  mb: 0.75,
                  borderRadius: 2,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  alignItems: 'flex-start',
                  bgcolor: 'grey.50',
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <IconButton
                      edge="end"
                      aria-label={`Download ${doc.original_name}`}
                      onClick={() => void onDownload(doc.id, doc.original_name)}
                      size="small"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label={`Delete ${doc.original_name}`}
                      onClick={() => onDelete(doc.id, doc.original_name)}
                      disabled={deletingId === doc.id}
                      size="small"
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemIcon sx={{ minWidth: 36, mt: 0.4 }}>
                  <DocIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={doc.original_name}
                  secondary={
                    <Box
                      component="span"
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 0.5,
                        mt: 0.5,
                        pr: 5,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                      >
                        <Typography component="span" variant="caption" color="textSecondary">
                          {formatFileSize(doc.file_size)}
                        </Typography>
                        <Chip
                          size="small"
                          label={doc.status}
                          color={documentStatusColor(doc.status)}
                          sx={{ height: 20, textTransform: 'capitalize' }}
                        />
                      </Box>
                      {doc.status === 'failed' && doc.error_message ? (
                        <Typography component="span" variant="caption" color="error">
                          {doc.error_message}
                        </Typography>
                      ) : null}
                    </Box>
                  }
                  slotProps={{
                    primary: {
                      noWrap: true,
                      sx: {
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        pr: 5,
                      },
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

const WorkspaceDocsSidebar = ({ workspaceId }: Props) => {
  const { isDocsSidebar, setIsDocsSidebar } = useLayout();

  return (
    <Drawer
      anchor="right"
      open={isDocsSidebar}
      onClose={() => setIsDocsSidebar(false)}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: layoutConfig.docsSidebarWidth },
          maxWidth: '100%',
          boxSizing: 'border-box',
        },
      }}
    >
      {workspaceId ? (
        <DocsPanelContent workspaceId={workspaceId} />
      ) : (
        <Box sx={{ p: 3 }}>
          <Typography color="textSecondary">
            Select a workspace to manage documents.
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default WorkspaceDocsSidebar;
