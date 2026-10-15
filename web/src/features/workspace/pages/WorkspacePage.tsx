import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { DeleteOutlined as ClearChatIcon } from '@mui/icons-material';
import { PageContainer } from '@/shared/components';
import UploadDocumentButton from '@/features/document/components/UploadDocumentButton';
import ChatComposer from '@/features/chat/components/ChatComposer';
import ChatMessageList from '@/features/chat/components/ChatMessageList';
import { useWorkspaceChat } from '@/features/chat/hooks';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { useWorkspacePage } from '../hooks';

const WorkspacePage = () => {
  const {
    workspaceId,
    selected,
    hasWorkspaces,
    workspacesError,
    refetchWorkspaces,
    openCreateWorkspace,
    docsLoading,
    docsError,
    refetchDocuments,
    hasDocuments,
    hasReadyDocument,
    hasFailedDocument,
  } = useWorkspacePage();

  const chat = useWorkspaceChat({
    workspaceId: selected?.id,
    enabled: Boolean(selected && hasReadyDocument),
  });

  if (workspacesError && !hasWorkspaces) {
    return (
      <PageContainer title="Workspaces" description="Failed to load">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            Couldn’t load workspaces.
          </Typography>
          <Button variant="contained" onClick={refetchWorkspaces}>
            Retry
          </Button>
        </Box>
      </PageContainer>
    );
  }

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
          <Box
            sx={{
              maxWidth: 440,
              width: '100%',
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              p: 4,
            }}
          >
            <WorkspaceEmptyState
              title="Create your first workspace"
              description="Workspaces hold your documents. Upload files there, then ask questions in chat."
              action={
                <Button variant="contained" size="large" onClick={openCreateWorkspace}>
                  Create workspace
                </Button>
              }
            />
          </Box>
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
            Select a workspace in the sidebar to continue.
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  const showChat = hasReadyDocument;

  return (
    <PageContainer title={selected.name} description="Workspace chat">
      <Box
        sx={{
          flex: 1,
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#FFFFFF',
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {showChat ? (
            chat.isError ? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  textAlign: 'center',
                }}
              >
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                  Couldn’t load messages.
                </Typography>
                <Button variant="contained" onClick={chat.refetchMessages}>
                  Retry
                </Button>
              </Box>
            ) : (
              <>
                {(chat.messages.length > 0 || chat.pendingUser) && (
                  <Box
                    sx={{
                      px: { xs: 2, sm: 3 },
                      pt: 1.5,
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Tooltip title="Clear chat history">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Clear chat history"
                          onClick={() => void chat.onClearHistory()}
                          disabled={chat.isClearing || chat.isSending}
                        >
                          <ClearChatIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                )}
                <ChatMessageList
                  messages={chat.messages}
                  pendingUser={chat.pendingUser}
                  streamingText={chat.streamingText}
                  isLoading={chat.isLoading}
                  isSending={chat.isSending}
                  listRef={chat.listRef}
                />
              </>
            )
          ) : (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              {docsLoading ? (
                <Typography color="textSecondary">Loading documents...</Typography>
              ) : docsError ? (
                <Stack spacing={2} sx={{ maxWidth: 420, textAlign: 'center', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Couldn’t load documents
                  </Typography>
                  <Typography color="textSecondary">
                    Something went wrong while fetching documents for this workspace.
                  </Typography>
                  <Button variant="contained" onClick={() => void refetchDocuments()}>
                    Retry
                  </Button>
                </Stack>
              ) : !hasDocuments ? (
                <WorkspaceEmptyState
                  title="This workspace has no documents yet"
                  description={
                    <>
                      Upload a PDF, TXT, or MD file for <strong>{selected.name}</strong>, then ask
                      questions about it.
                    </>
                  }
                  action={
                    <UploadDocumentButton
                      workspaceId={selected.id}
                      variant="contained"
                      size="large"
                      label="Upload document"
                    />
                  }
                />
              ) : hasFailedDocument && !hasReadyDocument ? (
                <WorkspaceEmptyState
                  title="Document processing failed"
                  description="Open the documents panel for details, or upload the file again."
                  action={
                    <UploadDocumentButton
                      workspaceId={selected.id}
                      variant="contained"
                      size="medium"
                      label="Upload again"
                    />
                  }
                />
              ) : (
                <WorkspaceEmptyState
                  title="Documents are being prepared"
                  description="Your files are uploaded. Processing will make them ready for questions."
                  action={
                    <UploadDocumentButton
                      workspaceId={selected.id}
                      variant="outlined"
                      size="medium"
                      label="Upload another"
                    />
                  }
                />
              )}
            </Box>
          )}
        </Box>

        <ChatComposer
          draft={showChat ? chat.draft : ''}
          setDraft={showChat ? chat.setDraft : () => undefined}
          canSend={showChat ? chat.canSend : false}
          isSending={showChat ? chat.isSending : false}
          disabled={!showChat}
          placeholder={
            showChat
              ? 'Ask a question about your documents...'
              : 'Upload and wait for a ready document before asking...'
          }
          onSubmit={showChat ? chat.onSubmit : (e) => e.preventDefault()}
          onComposerKeyDown={showChat ? chat.onComposerKeyDown : () => undefined}
        />
      </Box>
    </PageContainer>
  );
};

export default WorkspacePage;
