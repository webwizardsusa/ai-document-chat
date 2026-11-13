import { baseApi, API_TAGS } from '@/app/api';
import type { CreateWorkspaceRequest, Workspace } from '../types/workspace';

export const workspaceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWorkspaces: build.query<Workspace[], void>({
      query: () => '/workspaces',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: API_TAGS.Workspace, id })),
              { type: API_TAGS.Workspace, id: 'LIST' },
            ]
          : [{ type: API_TAGS.Workspace, id: 'LIST' }],
    }),
    createWorkspace: build.mutation<Workspace, CreateWorkspaceRequest>({
      query: (body) => ({
        url: '/workspaces',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: API_TAGS.Workspace, id: 'LIST' }],
    }),
    deleteWorkspace: build.mutation<null, string>({
      query: (workspaceId) => ({
        url: `/workspaces/${workspaceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, workspaceId) => [
        { type: API_TAGS.Workspace, id: 'LIST' },
        { type: API_TAGS.Workspace, id: workspaceId },
        { type: API_TAGS.Document, id: `LIST-${workspaceId}` },
        { type: API_TAGS.Message, id: `LIST-${workspaceId}` },
      ],
    }),
  }),
});

export const {
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} = workspaceApi;
