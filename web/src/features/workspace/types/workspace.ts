export type Workspace = {
  id: string;
  name: string;
  document_count: number;
  created_at: string;
  updated_at: string;
};

export type CreateWorkspaceRequest = {
  name: string;
};
