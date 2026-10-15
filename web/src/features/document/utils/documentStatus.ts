import type { DocumentStatus } from '../types/document';

export const documentStatusColor = (
  status: DocumentStatus,
): 'default' | 'info' | 'warning' | 'success' | 'error' => {
  switch (status) {
    case 'ready':
      return 'success';
    case 'processing':
      return 'info';
    case 'uploaded':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};
