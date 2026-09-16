export type Workspace = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type CreateWorkspaceRequest = {
  name: string;
};
