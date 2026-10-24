import { api } from './api';

export const getCourseMaterials = courseId => api.get(`/course-materials/course/${courseId}`);

export const uploadCourseMaterial = (courseId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/course-materials/course/${courseId}`, formData);
};

export const deleteCourseMaterial = materialId => api.delete(`/course-materials/${materialId}`);

export const downloadCourseMaterial = materialId => api.get(`/course-materials/${materialId}/download`);