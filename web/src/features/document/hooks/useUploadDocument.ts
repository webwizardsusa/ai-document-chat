import { useRef, type ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { useUploadDocumentMutation } from '../api/documentApi';

export const DOCUMENT_UPLOAD_ACCEPT =
  '.pdf,.txt,.md,application/pdf,text/plain,text/markdown';

type Options = {
  workspaceId: string;
  onUploaded?: () => void;
};

export const useUploadDocument = ({ workspaceId, onUploaded }: Options) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      await uploadDocument({ workspaceId, file }).unwrap();
      toast.success(`Uploaded ${file.name}`);
      onUploaded?.();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data: unknown }).data)
          : 'Upload failed';
      toast.error(message);
    }
  };

  return {
    inputRef,
    accept: DOCUMENT_UPLOAD_ACCEPT,
    isUploading: isLoading,
    openFilePicker,
    onFileChange,
  };
};
