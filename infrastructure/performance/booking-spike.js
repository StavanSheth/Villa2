import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users for 1 min
    { duration: '30s', target: 100 }, // Ramp up to 100 users (Spike)
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  // Scenario 17D/17F: Simultaneous Bookings & Flash Sale
  const url = 'http://127.0.0.1:8787/api/bookings/reserve';
  
  // Create a random future date
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 300) + 1);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);

  const payload = JSON.stringify({
    villaId: 'mock-villa-id', // Replaced dynamically or via setup
    checkIn: checkIn.toISOString(),
    checkOut: checkOut.toISOString(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  // We check that the response is either 200 (Success) or 409 (Conflict/Locked)
  check(res, {
    'is status 200 or 409': (r) => r.status === 200 || r.status === 409,
    'transaction time OK': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
