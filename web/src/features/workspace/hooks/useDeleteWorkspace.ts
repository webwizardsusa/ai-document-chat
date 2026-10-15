import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { useAppDispatch } from '@/app/store';
import { getErrorMessage } from '@/shared/utils';
import { useDeleteWorkspaceMutation } from '../api/workspaceApi';
import { setActiveWorkspaceId } from '../slices/workspaceSlice';

type Options = {
  workspaces: { id: string; name: string }[];
};

export const useDeleteWorkspace = ({ workspaces }: Options) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [deleteWorkspace, { isLoading, originalArgs }] = useDeleteWorkspaceMutation();
  const deletingId = isLoading && originalArgs ? originalArgs : null;

  const onDelete = async (workspaceId: string, name?: string) => {
    const ok = window.confirm(
      name
        ? `Delete workspace “${name}” and all of its documents and chat?`
        : 'Delete this workspace and all of its documents and chat?',
    );
    if (!ok) return;

    try {
      await deleteWorkspace(workspaceId).unwrap();
      const next = workspaces.find((w) => w.id !== workspaceId);
      if (next) {
        dispatch(setActiveWorkspaceId(next.id));
        navigate(`/workspaces/${next.id}`, { replace: true });
      } else {
        dispatch(setActiveWorkspaceId(null));
        navigate('/', { replace: true });
      }
      toast.success(name ? `Deleted ${name}` : 'Workspace deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    }
  };

  return { isDeleting: isLoading, deletingId, onDelete };
};
