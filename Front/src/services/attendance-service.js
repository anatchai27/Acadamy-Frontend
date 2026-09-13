import { api } from './api';
import { queueAttendanceEvent, listPendingAttendanceEvents, removeAttendanceEvent } from './attendance-offline-queue';

export const scanAttendance = async (payload, options = {}) => {
  const idempotencyKey = payload.idempotencyKey || crypto.randomUUID();
  const request = { ...payload, idempotencyKey };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const event = await queueAttendanceEvent({ operation: 'check-in', payload: request });
    return { offlineQueued: true, data: { status: 'queued', clientEventId: event.clientEventId } };
  }
  return api.post('/attendance/scan', request, {
    ...options,
    headers: { ...(options.headers || {}), 'Idempotency-Key': idempotencyKey },
  });
}

export const syncPendingAttendance = async () => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { synced: 0, failed: 0 };
  const events = await listPendingAttendanceEvents();
  let synced = 0;
  let failed = 0;
  for (const event of events) {
    if (event.expiresAt && Date.parse(event.expiresAt) <= Date.now()) {
      await removeAttendanceEvent(event.clientEventId);
      failed += 1;
      continue;
    }
    try {
      await api.post('/attendance/scan', event.payload, {
        headers: { 'Idempotency-Key': event.payload.idempotencyKey },
      });
      await removeAttendanceEvent(event.clientEventId);
      synced += 1;
    } catch (error) {
      if (error?.data?.errorCode === 'DUPLICATE_SCAN') {
        await removeAttendanceEvent(event.clientEventId);
        synced += 1;
      } else {
        failed += 1;
      }
    }
  }
  return { synced, failed };
};

export const getDailyAttendance = (params = {}, options = {}) => {
  return api.get('/attendance/daily', { params, ...options });
}

export const submitManualAttendance = payload => {
  return api.post('/attendance/manual', payload);
}

export const getPickupAuthorizations = studentId => {
  return api.get(`/students/${studentId}/pickup-authorizations`);
}

export const checkoutAttendance = (attendanceId, payload) => {
  return api.post(`/attendance/${attendanceId}/checkout`, payload);
}

export const attendanceService = {
  scanAttendance,
  syncPendingAttendance,
  getDailyAttendance,
  submitManualAttendance,
  getPickupAuthorizations,
  checkoutAttendance,
};
