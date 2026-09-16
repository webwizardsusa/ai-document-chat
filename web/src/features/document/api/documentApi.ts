import { baseApi, API_TAGS } from '@/app/api';
import type { Document } from '../types/document';

export const documentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDocuments: build.query<Document[], string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/documents`,
      providesTags: (result, _error, workspaceId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: API_TAGS.Document, id })),
              { type: API_TAGS.Document, id: `LIST-${workspaceId}` },
            ]
          : [{ type: API_TAGS.Document, id: `LIST-${workspaceId}` }],
    }),
    uploadDocument: build.mutation<Document, { workspaceId: string; file: File }>({
      query: ({ workspaceId, file }) => {
        const body = new FormData();
        body.append('file', file);
        return {
          url: `/workspaces/${workspaceId}/documents`,
          method: 'POST',
          body,
        };
      },
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: API_TAGS.Document, id: `LIST-${workspaceId}` },
      ],
    }),
  }),
});

export const { useGetDocumentsQuery, useUploadDocumentMutation } = documentApi;
