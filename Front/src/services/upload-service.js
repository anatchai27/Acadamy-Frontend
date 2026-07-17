import { api } from './api';

export function uploadPaymentSlip(file, paymentId, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('paymentId', String(paymentId));
  return api.post('/uploads/payment-slip', formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function uploadHomeworkFile(file, homeworkId, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('homeworkId', String(homeworkId));
  return api.post('/uploads/homework', formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function uploadHomeworkSubmission(file, submissionId, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('submissionId', String(submissionId));
  return api.post('/uploads/homework-submission', formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function uploadStudentPhoto(file, studentId, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('studentId', String(studentId));
  return api.post('/uploads/student-photo', formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const uploadService = {
  uploadPaymentSlip,
  uploadHomeworkFile,
  uploadHomeworkSubmission,
  uploadStudentPhoto,
};