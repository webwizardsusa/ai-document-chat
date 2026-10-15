import { toast } from 'react-toastify';
import { authedFetch } from '@/app/api/authedFetch';
import { downloadBlob, getErrorMessage, readResponseError } from '@/shared/utils';
import { documentDownloadPath } from '../api/documentApi';

type Options = {
  workspaceId: string;
};

export const useDownloadDocument = ({ workspaceId }: Options) => {
  const onDownload = async (documentId: string, name?: string) => {
    try {
      const response = await authedFetch(documentDownloadPath(workspaceId, documentId), {
        method: 'GET',
        headers: { Accept: '*/*' },
      });
      if (!response.ok) {
        throw new Error(await readResponseError(response, 'Download failed'));
      }
      downloadBlob(await response.blob(), name || 'document');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Download failed'));
    }
  };

  return { onDownload };
};
