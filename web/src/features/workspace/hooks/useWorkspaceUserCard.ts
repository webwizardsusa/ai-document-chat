import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { useLogoutMutation } from '@/features/auth/api/authApi';
import { logout, selectAuthUser } from '@/features/auth/slices/authSlice';
import { setActiveWorkspaceId } from '../slices/workspaceSlice';

const initials = (name?: string | null) => {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
};

export const useWorkspaceUserCard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectAuthUser);
  const [logoutRequest, { isLoading }] = useLogoutMutation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const openMenu = (element: HTMLElement) => setAnchorEl(element);
  const closeMenu = () => setAnchorEl(null);

  const onLogout = async () => {
    closeMenu();
    try {
      await logoutRequest().unwrap();
    } catch {
      // clear local session even if API logout fails
    } finally {
      dispatch(setActiveWorkspaceId(null));
      dispatch(logout());
      navigate('/auth/login', { replace: true });
    }
  };

  return {
    user,
    userInitials: initials(user?.name),
    isLoggingOut: isLoading,
    menuOpen: Boolean(anchorEl),
    anchorEl,
    openMenu,
    closeMenu,
    onLogout,
  };
};
