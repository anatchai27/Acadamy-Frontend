import http from 'k6/http';
import { check } from 'k6';

const baseUrl = (__ENV.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const authToken = __ENV.AUTH_TOKEN || '';
const sessionId = Number(__ENV.SESSION_ID || 1);
const qrTokens = (__ENV.QR_TOKENS || __ENV.QR_TOKEN || '').split(',').map(value => value.trim()).filter(Boolean);

export const options = {
  scenarios: {
    attendance_scan: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30s',
    },
  },
  thresholds: {
    checks: ['rate>0.99'],
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
  },
};

export default function () {
  if (qrTokens.length === 0) {
    throw new Error('Set QR_TOKEN or QR_TOKENS before running the attendance load test.');
  }

  const qrToken = qrTokens[(__VU - 1) % qrTokens.length];
  const response = http.post(
    `${baseUrl}/api/attendance/scan`,
    JSON.stringify({ qrToken, sessionId }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      tags: { endpoint: 'attendance_scan' },
    },
  );

  check(response, {
    'attendance response is successful or expected duplicate': responseValue =>
      responseValue.status === 200 || responseValue.status === 400,
  });
}
