import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import {
  DescriptionOutlined as DocIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { PageContainer } from '@/shared/components';
import UploadDocumentButton from '@/features/document/components/UploadDocumentButton';
import { useWorkspacePage } from '../hooks';

const WorkspacePage = () => {
  const {
    workspaceId,
    selected,
    hasWorkspaces,
    openCreateWorkspace,
    docsLoading,
    hasDocuments,
    hasReadyDocument,
  } = useWorkspacePage();

  if (!hasWorkspaces) {
    return (
      <PageContainer title="Get started" description="Create a workspace">
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Stack
            spacing={2}
            sx={{
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              p: 4,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
              }}
            >
              <DocIcon color="primary" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Create your first workspace
            </Typography>
            <Typography color="textSecondary">
              Workspaces hold your documents. Upload files there, then ask questions in chat.
            </Typography>
            <Button variant="contained" size="large" onClick={openCreateWorkspace}>
              Create workspace
            </Button>
          </Stack>
        </Box>
      </PageContainer>
    );
  }

  if (!selected && workspaceId) {
    return (
      <PageContainer title="Workspace" description="Loading">
        <Box sx={{ p: 3 }}>
          <Typography color="textSecondary">Loading workspace...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!selected) {
    return (
      <PageContainer title="Select workspace" description="Choose a workspace">
        <Box sx={{ p: 3 }}>
          <Typography color="textSecondary">
            Expand a workspace in the sidebar to continue.
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={selected.name} description="Workspace chat">
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          {docsLoading ? (
            <Typography color="textSecondary">Loading documents...</Typography>
          ) : !hasDocuments ? (
            <Stack spacing={2} sx={{ maxWidth: 480, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                }}
              >
                <DocIcon color="primary" sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                This workspace has no documents yet
              </Typography>
              <Typography color="textSecondary">
                Upload a PDF, TXT, or MD file for <strong>{selected.name}</strong>, then ask
                questions about it.
              </Typography>
              <Box sx={{ alignSelf: 'center' }}>
                <UploadDocumentButton
                  workspaceId={selected.id}
                  variant="contained"
                  size="large"
                  label="Upload document"
                />
              </Box>
            </Stack>
          ) : !hasReadyDocument ? (
            <Stack spacing={1.5} sx={{ maxWidth: 480, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Documents are being prepared
              </Typography>
              <Typography color="textSecondary">
                Your files are uploaded. Processing will make them ready for questions.
              </Typography>
              <Box sx={{ alignSelf: 'center' }}>
                <UploadDocumentButton
                  workspaceId={selected.id}
                  variant="outlined"
                  size="medium"
                  label="Upload another"
                />
              </Box>
            </Stack>
          ) : (
            <Typography color="textSecondary">
              Ask a question about your documents below.
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            p: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ position: 'relative', maxWidth: 900, mx: 'auto' }}>
            <TextField
              fullWidth
              placeholder={
                hasReadyDocument
                  ? 'Ask a question about your documents...'
                  : 'Upload and wait for a ready document before asking...'
              }
              disabled={!hasReadyDocument}
              multiline
              maxRows={4}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'grey.100',
                  pr: 6,
                },
              }}
            />
            <Button
              variant="contained"
              disabled={!hasReadyDocument}
              aria-label="Send"
              sx={{
                position: 'absolute',
                right: 8,
                bottom: 8,
                minWidth: 40,
                width: 40,
                height: 40,
                p: 0,
                borderRadius: 2,
              }}
            >
              <SendIcon fontSize="small" />
            </Button>
          </Box>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            AI responses are generated from your workspace documents and may not always be 100%
            accurate.
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default WorkspacePage;
