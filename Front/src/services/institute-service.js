import { api } from './api';

export const getInstitute = (options = {}) => {
  return api.get('/institutes/me', options);
}

export const updateInstitute = (payload, options = {}) => {
  return api.put('/institutes/me', payload, options);
}

export const uploadLogo = (file, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads/logo', formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const instituteService = {
  getInstitute,
  updateInstitute,
  uploadLogo,
};
