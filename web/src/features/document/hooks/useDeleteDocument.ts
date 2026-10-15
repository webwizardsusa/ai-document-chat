import { toast } from 'react-toastify';
import { getErrorMessage } from '@/shared/utils';
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
    if (!window.confirm(name ? `Delete “${name}”?` : 'Delete this document?')) return;

    try {
      await deleteDocument({ workspaceId, documentId }).unwrap();
      toast.success(name ? `Deleted ${name}` : 'Document deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    }
  };

  return {
    isDeleting: isLoading,
    deletingId,
    onDelete,
  };
};
