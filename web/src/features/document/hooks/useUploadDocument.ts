import { useRef, type ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { useUploadDocumentMutation } from '../api/documentApi';

export const DOCUMENT_UPLOAD_ACCEPT =
  '.pdf,.txt,.md,application/pdf,text/plain,text/markdown';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.txt', '.md']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
]);

type Options = {
  workspaceId: string;
  onUploaded?: () => void;
};

const extensionOf = (name: string) => {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
};

const validateFile = (file: File): string | null => {
  const extension = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return 'Only PDF, TXT, and MD files are allowed';
  }
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return 'Only PDF, TXT, and MD files are allowed';
  }
  if (file.size <= 0) {
    return 'Empty file';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'File exceeds 25 MB limit';
  }
  return null;
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

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

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
