import { toast } from 'react-toastify';
import { useDeleteDocumentMutation } from '../api/documentApi';

type Options = {
  workspaceId: string;
};

export const useDeleteDocument = ({ workspaceId }: Options) => {
  const [deleteDocument, { isLoading, originalArgs }] = useDeleteDocumentMutation();

  const deletingId =
    isLoading && originalArgs?.workspaceId === workspaceId
      ? originalArgs.documentId
      : null;

  const onDelete = async (documentId: string, name?: string) => {
    const confirmed = window.confirm(
      name ? `Delete “${name}”?` : 'Delete this document?',
    );
    if (!confirmed) return;

    try {
      await deleteDocument({ workspaceId, documentId }).unwrap();
      toast.success(name ? `Deleted ${name}` : 'Document deleted');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data: unknown }).data)
          : 'Delete failed';
      toast.error(message);
    }
  };

  return {
    isDeleting: isLoading,
    deletingId,
    onDelete,
  };
};
