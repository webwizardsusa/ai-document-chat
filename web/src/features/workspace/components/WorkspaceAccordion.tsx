import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  FolderOutlined as FolderIcon,
} from '@mui/icons-material';
import WorkspaceDocumentList from '@/features/document/components/WorkspaceDocumentList';
import type { Workspace } from '../types/workspace';

type Props = {
  workspaces: Workspace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  isLoading?: boolean;
};

const WorkspaceAccordion = ({
  workspaces,
  activeId,
  onSelect,
  onCreate,
  isLoading,
}: Props) => (
  <Box sx={{ px: 2, pt: 2, pb: 1, flex: 1, minHeight: 0, overflow: 'auto' }}>
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
        WORKSPACES
      </Typography>
      <Button
        size="small"
        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
        onClick={onCreate}
        sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: '0.75rem' }}
      >
        New
      </Button>
    </Box>

    {isLoading ? (
      <Typography variant="body2" color="textSecondary" sx={{ px: 1, py: 1 }}>
        Loading...
      </Typography>
    ) : workspaces.length === 0 ? (
      <Box sx={{ borderRadius: 2, bgcolor: 'primary.light', p: 1.5 }}>
        <Typography variant="body2" color="primary.main" sx={{ mb: 1 }}>
          Create your first workspace to upload documents and chat.
        </Typography>
        <Button size="small" variant="contained" onClick={onCreate} startIcon={<AddIcon />}>
          Create workspace
        </Button>
      </Box>
    ) : (
      workspaces.map((workspace) => {
        const expanded = workspace.id === activeId;
        return (
          <Accordion
            key={workspace.id}
            expanded={expanded}
            disableGutters
            elevation={0}
            onChange={(_, isExpanded) => {
              if (isExpanded) {
                onSelect(workspace.id);
              }
            }}
            sx={{
              mb: 0.75,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              overflow: 'hidden',
              bgcolor: expanded ? 'primary.light' : 'background.paper',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon fontSize="small" />}
              sx={{
                minHeight: 44,
                px: 1.25,
                '& .MuiAccordionSummary-content': {
                  my: 1,
                  alignItems: 'center',
                  gap: 1,
                },
              }}
            >
              <FolderIcon
                sx={{
                  fontSize: 20,
                  color: expanded ? 'primary.main' : 'text.secondary',
                }}
              />
              <Typography
                noWrap
                sx={{
                  fontWeight: expanded ? 600 : 500,
                  fontSize: '0.875rem',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {workspace.name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5, bgcolor: 'background.paper' }}>
              {expanded ? <WorkspaceDocumentList workspaceId={workspace.id} /> : null}
            </AccordionDetails>
          </Accordion>
        );
      })
    )}
  </Box>
);

export default WorkspaceAccordion;
