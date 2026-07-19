import { api } from './api';

export function uploadPaymentSlip(file, paymentId, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads/payment-slip', formData, {
    ...options,
    params: { paymentId },
  });
}

export function uploadHomeworkFile(file, homeworkId, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads/homework', formData, {
    ...options,
    params: { homeworkId },
  });
}

export function uploadHomeworkSubmission(file, submissionId, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads/homework-submission', formData, {
    ...options,
    params: { submissionId },
  });
}

export function uploadStudentPhoto(file, studentId, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads/student-photo', formData, {
    ...options,
    params: { studentId },
  });
}

export function uploadTeacherPhoto(file, teacherId, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads/teacher-photo', formData, {
    ...options,
    params: { teacherId },
  });
}

export const uploadService = {
  uploadPaymentSlip,
  uploadHomeworkFile,
  uploadHomeworkSubmission,
  uploadStudentPhoto,
  uploadTeacherPhoto,
};