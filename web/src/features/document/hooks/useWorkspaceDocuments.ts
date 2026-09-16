import { useGetDocumentsQuery } from '../api/documentApi';
import type { Document, DocumentStatus } from '../types/document';

export const documentStatusColor = (
  status: DocumentStatus,
): 'default' | 'info' | 'warning' | 'success' | 'error' => {
  switch (status) {
    case 'ready':
      return 'success';
    case 'processing':
      return 'info';
    case 'uploaded':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

const isPendingStatus = (status: DocumentStatus) =>
  status === 'uploaded' || status === 'processing';

/** Shared documents query with single polling subscription while processing. */
export const useDocumentsQuery = (workspaceId: string | null | undefined) => {
  const skip = !workspaceId;
  const { data, isLoading, isError, isSuccess, isFetching, refetch } =
    useGetDocumentsQuery(workspaceId ?? '', { skip });

  const documents: Document[] = data ?? [];
  const shouldPoll = !skip && documents.some((doc) => isPendingStatus(doc.status));

  useGetDocumentsQuery(workspaceId ?? '', {
    skip: skip || !shouldPoll,
    pollingInterval: shouldPoll ? 3000 : 0,
  });

  return {
    documents,
    isLoading: Boolean(isLoading && !data),
    isFetching,
    isError: Boolean(isError),
    isSuccess: Boolean(isSuccess),
    isEmpty: Boolean(isSuccess && documents.length === 0),
    hasPending: shouldPoll,
    hasReadyDocument: documents.some((d) => d.status === 'ready'),
    hasFailedDocument: documents.some((d) => d.status === 'failed'),
    refetch,
  };
};

export const useWorkspaceDocuments = (workspaceId: string) => useDocumentsQuery(workspaceId);
