import { api } from './api';

export function getInstitute(options = {}) {
  return api.get('/institutes/me', options);
}

export function updateInstitute(payload, options = {}) {
  return api.put('/institutes/me', payload, options);
}

export function uploadLogo(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/institutes/logo', formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const instituteService = {
  getInstitute,
  updateInstitute,
  uploadLogo,
};
