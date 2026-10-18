import { api } from './api';

export const issueParentLineLinkCode = parentId =>
  api.post(`/parents/${parentId}/line-link-code`, {});
