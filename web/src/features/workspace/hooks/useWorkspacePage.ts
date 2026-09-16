import { useOutletContext, useParams } from 'react-router';
import { useDocumentsQuery } from '@/features/document/hooks';
import type { WorkspaceOutletContext } from './useWorkspaceShell';

export const useWorkspacePage = () => {
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const {
    workspace,
    workspaces,
    openCreateWorkspace,
    workspacesError,
    refetchWorkspaces,
  } = useOutletContext<WorkspaceOutletContext>();

  const selected = workspace ?? null;
  const {
    documents,
    isLoading: docsLoading,
    isError: docsError,
    isEmpty,
    hasReadyDocument,
    hasFailedDocument,
    refetch: refetchDocuments,
  } = useDocumentsQuery(selected?.id);

  return {
    workspaceId,
    workspaces,
    selected,
    hasWorkspaces: workspaces.length > 0,
    workspacesError,
    refetchWorkspaces,
    openCreateWorkspace,
    documents,
    docsLoading,
    docsError,
    refetchDocuments,
    hasDocuments: documents.length > 0,
    isDocsEmpty: isEmpty,
    hasReadyDocument,
    hasFailedDocument,
  };
};
