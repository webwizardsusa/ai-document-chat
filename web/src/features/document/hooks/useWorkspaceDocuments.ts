import { useEffect } from 'react';
import { useGetDocumentsQuery } from '../api/documentApi';
import type { DocumentStatus } from '../types/document';

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

export const useWorkspaceDocuments = (workspaceId: string) => {
  const { data: documents = [], isLoading, isError, refetch } =
    useGetDocumentsQuery(workspaceId);

  const hasPending = documents.some((doc) => isPendingStatus(doc.status));

  useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(() => {
      void refetch();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [hasPending, refetch]);

  return {
    documents,
    isLoading,
    isError,
    isEmpty: !isLoading && !isError && documents.length === 0,
  };
};
