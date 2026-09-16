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
  workspacesError: boolean;
  refetchWorkspaces: () => void;
};

export const useWorkspaceShell = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const activeWorkspaceId = useAppSelector(selectActiveWorkspaceId);
  const {
    data,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    refetch,
  } = useGetWorkspacesQuery();
  const workspaces = useMemo(() => data ?? [], [data]);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!isSuccess) return;

    if (workspaceId) {
      dispatch(setActiveWorkspaceId(workspaceId));
      return;
    }

    if (workspaces.length > 0 && !activeWorkspaceId) {
      const firstId = workspaces[0].id;
      dispatch(setActiveWorkspaceId(firstId));
      navigate(`/workspaces/${firstId}`, { replace: true });
    }
  }, [
    workspaceId,
    workspaces,
    isSuccess,
    activeWorkspaceId,
    dispatch,
    navigate,
  ]);

  useEffect(() => {
    if (!workspaceId || !isSuccess) return;
    const exists = workspaces.some((w) => w.id === workspaceId);
    if (!exists) {
      if (workspaces.length > 0) {
        navigate(`/workspaces/${workspaces[0].id}`, { replace: true });
      } else {
        dispatch(setActiveWorkspaceId(null));
        navigate('/', { replace: true });
      }
    }
  }, [workspaceId, workspaces, isSuccess, navigate, dispatch]);

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
    isBootstrapping: isLoading && !data && !isError,
    isLoadingWorkspaces: isFetching && workspaces.length === 0 && !isError,
    isWorkspacesError: isError,
    refetchWorkspaces: () => {
      void refetch();
    },
    createOpen,
    openCreateWorkspace,
    closeCreateWorkspace,
    selectWorkspace,
    onWorkspaceCreated,
    outletContext: {
      workspace: activeWorkspace,
      workspaces,
      openCreateWorkspace,
      workspacesError: isError,
      refetchWorkspaces: () => {
        void refetch();
      },
    } satisfies WorkspaceOutletContext,
  };
};
