import { useRef, type ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/shared/utils';
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

const validateFile = (file: File): string | null => {
  const idx = file.name.lastIndexOf('.');
  const extension = idx >= 0 ? file.name.slice(idx).toLowerCase() : '';
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return 'Only PDF, TXT, and MD files are allowed';
  }
  // Browsers often send empty or application/octet-stream; trust extension then.
  const mime = file.type;
  if (
    mime &&
    mime !== 'application/octet-stream' &&
    !ALLOWED_MIME_TYPES.has(mime)
  ) {
    return 'Only PDF, TXT, and MD files are allowed';
  }
  if (file.size <= 0) return 'Empty file';
  if (file.size > MAX_UPLOAD_BYTES) return 'File exceeds 25 MB limit';
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
      toast.error(getErrorMessage(err, 'Upload failed'));
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
