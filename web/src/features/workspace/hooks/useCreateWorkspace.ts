import { useState, type FormEvent } from 'react';
import { getErrorMessage } from '@/shared/utils';
import { useCreateWorkspaceMutation } from '../api/workspaceApi';

type Options = {
  onClose: () => void;
  onCreated?: (workspaceId: string) => void;
};

export const useCreateWorkspace = ({ onClose, onCreated }: Options) => {
  const [name, setName] = useState('');
  const [createWorkspace, { isLoading, error, reset }] = useCreateWorkspaceMutation();

  const apiError = error ? getErrorMessage(error) : null;

  const handleClose = () => {
    setName('');
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      const workspace = await createWorkspace({ name: trimmed }).unwrap();
      setName('');
      reset();
      onClose();
      onCreated?.(workspace.id);
    } catch {
      // error shown from mutation state
    }
  };

  return {
    name,
    setName,
    isLoading,
    apiError,
    canSubmit: Boolean(name.trim()) && !isLoading,
    handleClose,
    handleSubmit,
  };
};
