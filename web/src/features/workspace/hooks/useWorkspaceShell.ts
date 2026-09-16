import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { useGetWorkspacesQuery } from '../api/workspaceApi';
import {
  selectActiveWorkspaceId,
  setActiveWorkspaceId,
} from '../slices/workspaceSlice';
import type { Workspace } from '../types/workspace';

export type WorkspaceOutletContext = {
  workspace: Workspace | null;
  workspaces: Workspace[];
  openCreateWorkspace: () => void;
};

export const useWorkspaceShell = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const activeWorkspaceId = useAppSelector(selectActiveWorkspaceId);
  const { data: workspaces = [], isLoading, isFetching } = useGetWorkspacesQuery();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      dispatch(setActiveWorkspaceId(workspaceId));
      return;
    }

    if (!isLoading && workspaces.length > 0 && !activeWorkspaceId) {
      const firstId = workspaces[0].id;
      dispatch(setActiveWorkspaceId(firstId));
      navigate(`/workspaces/${firstId}`, { replace: true });
    }
  }, [workspaceId, workspaces, isLoading, activeWorkspaceId, dispatch, navigate]);

  useEffect(() => {
    if (!workspaceId || isLoading) return;
    const exists = workspaces.some((w) => w.id === workspaceId);
    if (!exists && workspaces.length > 0) {
      navigate(`/workspaces/${workspaces[0].id}`, { replace: true });
    }
  }, [workspaceId, workspaces, isLoading, navigate]);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === (workspaceId || activeWorkspaceId)) ?? null,
    [workspaces, workspaceId, activeWorkspaceId],
  );

  const selectWorkspace = (id: string) => {
    dispatch(setActiveWorkspaceId(id));
    navigate(`/workspaces/${id}`);
  };

  const openCreateWorkspace = () => setCreateOpen(true);
  const closeCreateWorkspace = () => setCreateOpen(false);

  const onWorkspaceCreated = (id: string) => {
    dispatch(setActiveWorkspaceId(id));
    navigate(`/workspaces/${id}`);
  };

  return {
    workspaces,
    activeWorkspace,
    isBootstrapping: isLoading && workspaces.length === 0,
    isLoadingWorkspaces: isFetching && workspaces.length === 0,
    createOpen,
    openCreateWorkspace,
    closeCreateWorkspace,
    selectWorkspace,
    onWorkspaceCreated,
    outletContext: {
      workspace: activeWorkspace,
      workspaces,
      openCreateWorkspace,
    } satisfies WorkspaceOutletContext,
  };
};
