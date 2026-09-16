import { Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUploadDocument } from '../hooks';

type Props = {
  workspaceId: string;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  label?: string;
  fullWidth?: boolean;
  onUploaded?: () => void;
};

const UploadDocumentButton = ({
  workspaceId,
  variant = 'outlined',
  size = 'small',
  label = 'Upload document',
  fullWidth,
  onUploaded,
}: Props) => {
  const { inputRef, accept, isUploading, openFilePicker, onFileChange } = useUploadDocument({
    workspaceId,
    onUploaded,
  });

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} hidden onChange={onFileChange} />
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        startIcon={
          isUploading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />
        }
        onClick={openFilePicker}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : label}
      </Button>
    </>
  );
};

export default UploadDocumentButton;
