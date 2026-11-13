import { useEffect, useState } from 'react';
import { useGetDocumentsQuery } from '../api/documentApi';
import type { Document, DocumentStatus } from '../types/document';

const isPendingStatus = (status: DocumentStatus) =>
  status === 'uploaded' || status === 'processing';

/** Shared documents query; polls while any doc is uploaded/processing. */
export const useDocumentsQuery = (workspaceId: string | null | undefined) => {
  const skip = !workspaceId;
  const [shouldPoll, setShouldPoll] = useState(false);

  const { data, isLoading, isError, isSuccess, isFetching, refetch } =
    useGetDocumentsQuery(workspaceId ?? '', {
      skip,
      pollingInterval: shouldPoll ? 3000 : 0,
    });

  const documents: Document[] = data ?? [];

  useEffect(() => {
    setShouldPoll(!skip && (data ?? []).some((doc) => isPendingStatus(doc.status)));
  }, [skip, data]);

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
