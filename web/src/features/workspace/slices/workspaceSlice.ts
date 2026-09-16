import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type WorkspaceUiState = {
  /** Selected workspace id; null until user has / selects one. */
  activeWorkspaceId: string | null;
};

const initialState: WorkspaceUiState = {
  activeWorkspaceId: null,
};

const workspaceSlice = createSlice({
  name: 'workspaceUi',
  initialState,
  reducers: {
    setActiveWorkspaceId: (state, action: PayloadAction<string | null>) => {
      state.activeWorkspaceId = action.payload;
    },
  },
});

export const { setActiveWorkspaceId } = workspaceSlice.actions;
export default workspaceSlice.reducer;

export const selectActiveWorkspaceId = (state: { workspaceUi: WorkspaceUiState }) =>
  state.workspaceUi.activeWorkspaceId;
