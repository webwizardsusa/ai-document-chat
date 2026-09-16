import {
  Avatar,
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useWorkspaceUserCard } from '../hooks';

const WorkspaceUserCard = () => {
  const {
    user,
    userInitials,
    isLoggingOut,
    menuOpen,
    anchorEl,
    openMenu,
    closeMenu,
    onLogout,
  } = useWorkspaceUserCard();

  return (
    <Box
      sx={{
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        p: 2,
      }}
    >
      <Box
        onClick={(e) => openMenu(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          cursor: 'pointer',
          borderRadius: 1,
          p: 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
            fontWeight: 700,
          }}
        >
          {userInitials}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block' }}>
            {user?.email}
          </Typography>
        </Box>
        <IconButton size="small" aria-label="Account menu">
          <ArrowDownIcon fontSize="small" />
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MenuItem onClick={onLogout} disabled={isLoggingOut}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{isLoggingOut ? 'Signing out...' : 'Sign out'}</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default WorkspaceUserCard;
