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
    getWorkspace: build.query<Workspace, string>({
      query: (id) => `/workspaces/${id}`,
      providesTags: (_result, _error, id) => [{ type: API_TAGS.Workspace, id }],
    }),
    createWorkspace: build.mutation<Workspace, CreateWorkspaceRequest>({
      query: (body) => ({
        url: '/workspaces',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: API_TAGS.Workspace, id: 'LIST' }],
    }),
  }),
});

export const {
  useGetWorkspacesQuery,
  useGetWorkspaceQuery,
  useCreateWorkspaceMutation,
} = workspaceApi;
