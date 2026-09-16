import { useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { useGetDocumentsQuery } from '@/features/document/api/documentApi';
import type { WorkspaceOutletContext } from './useWorkspaceShell';

export const useWorkspacePage = () => {
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const { workspace, workspaces, openCreateWorkspace } =
    useOutletContext<WorkspaceOutletContext>();

  const selected = workspace ?? null;
  const { data: documents = [], isLoading: docsLoading, refetch } = useGetDocumentsQuery(
    selected?.id ?? '',
    { skip: !selected },
  );

  const hasPending = documents.some(
    (d) => d.status === 'uploaded' || d.status === 'processing',
  );

  useEffect(() => {
    if (!selected || !hasPending) return;
    const timer = window.setInterval(() => {
      void refetch();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [selected, hasPending, refetch]);

  return {
    workspaceId,
    workspaces,
    selected,
    hasWorkspaces: workspaces.length > 0,
    openCreateWorkspace,
    documents,
    docsLoading,
    hasDocuments: documents.length > 0,
    hasReadyDocument: documents.some((d) => d.status === 'ready'),
  };
};
