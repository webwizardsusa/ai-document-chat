import { baseApi, API_TAGS } from '@/app/api';
import type { ChatMessage } from '../types/chat';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMessages: build.query<ChatMessage[], string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/messages`,
      providesTags: (result, _error, workspaceId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: API_TAGS.Message, id })),
              { type: API_TAGS.Message, id: `LIST-${workspaceId}` },
            ]
          : [{ type: API_TAGS.Message, id: `LIST-${workspaceId}` }],
    }),
    clearMessages: build.mutation<{ deleted: number }, string>({
      query: (workspaceId) => ({
        url: `/workspaces/${workspaceId}/messages`,
        method: 'DELETE',
      }),
      async onQueryStarted(workspaceId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          chatApi.util.updateQueryData('getMessages', workspaceId, () => []),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_result, _error, workspaceId) => [
        { type: API_TAGS.Message, id: `LIST-${workspaceId}` },
      ],
    }),
  }),
});

export const messageStreamPath = (workspaceId: string) =>
  `/workspaces/${workspaceId}/messages/stream`;

export const { useGetMessagesQuery, useClearMessagesMutation } = chatApi;
