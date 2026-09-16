import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { DescriptionOutlined as DocIcon } from '@mui/icons-material';
import { formatFileSize } from '../utils/formatFileSize';
import { documentStatusColor, useWorkspaceDocuments } from '../hooks';
import UploadDocumentButton from './UploadDocumentButton';

type Props = {
  workspaceId: string;
};

const WorkspaceDocumentList = ({ workspaceId }: Props) => {
  const { documents, isLoading, isError, isEmpty } = useWorkspaceDocuments(workspaceId);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.4 }}
        >
          DOCUMENTS
        </Typography>
        <UploadDocumentButton
          workspaceId={workspaceId}
          variant="text"
          size="small"
          label="Upload"
        />
      </Box>

      {isLoading ? (
        <Typography variant="body2" color="textSecondary">
          Loading documents...
        </Typography>
      ) : isError ? (
        <Typography variant="body2" color="error">
          Failed to load documents
        </Typography>
      ) : isEmpty ? (
        <Box
          sx={{
            borderRadius: 2,
            border: (theme) => `1px dashed ${theme.palette.grey[300]}`,
            bgcolor: 'grey.100',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            textAlign: 'center',
          }}
        >
          <DocIcon sx={{ color: 'grey.400', fontSize: 28 }} />
          <Typography variant="body2" color="textSecondary">
            No documents in this workspace yet
          </Typography>
          <UploadDocumentButton workspaceId={workspaceId} variant="outlined" size="small" />
        </Box>
      ) : (
        <List disablePadding dense>
          {documents.map((doc) => (
            <ListItem
              key={doc.id}
              sx={{
                px: 0.5,
                borderRadius: 1,
                mb: 0.5,
                alignItems: 'flex-start',
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                <DocIcon sx={{ fontSize: 18, color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText
                primary={doc.original_name}
                secondary={`${formatFileSize(doc.file_size)}`}
                slotProps={{
                  primary: {
                    noWrap: true,
                    sx: { fontSize: '0.8125rem', fontWeight: 500 },
                  },
                  secondary: { sx: { fontSize: '0.75rem' } },
                }}
              />
              <Chip
                size="small"
                label={doc.status}
                color={documentStatusColor(doc.status)}
                sx={{ ml: 0.5, height: 22, textTransform: 'capitalize' }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default WorkspaceDocumentList;
