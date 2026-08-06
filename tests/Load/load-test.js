import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        smoke: {
            executor: 'per-vu-iterations',
            vus: 1,
            iterations: 10,
            exec: 'smoke',
        },
        load: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
                { duration: '20s', target: __ENV.TARGET_VUS || 10 },
                { duration: '30s', target: __ENV.TARGET_VUS || 10 },
                { duration: '10s', target: 0 },
            ],
            exec: 'load',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<500'],
    },
};

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:8000/api';
const EMAIL = __ENV.TEST_EMAIL || 'admin@threedos.com';
const PASSWORD = __ENV.TEST_PASSWORD || 'password';

const PUBLIC_GETS = [
    '/v1/destinations',
    '/v1/hotels',
    '/v1/restaurants',
    '/v1/attractions',
    '/v1/categories',
];

function loginToken() {
    const res = http.post(`${BASE}/login`, JSON.stringify({ email: EMAIL, password: PASSWORD }), {
        headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'login 200': (r) => r.status === 200 });
    return res.json('token');
}

function authedHeaders(token) {
    return { Authorization: `Bearer ${token}` };
}

export function smoke() {
    const token = loginToken();
    const headers = authedHeaders(token);

    http.batch(PUBLIC_GETS.map((u) => ({ method: 'GET', url: BASE + u, params: { tags: { type: 'public' } } })));

    const me = http.get(`${BASE}/user`, { headers, tags: { type: 'auth' } });
    check(me, { 'me 200': (r) => r.status === 200 });

    const trip = http.post(
        `${BASE}/v1/trips`,
        JSON.stringify({
            title: `load-trip-${__VU}-${__ITER}`,
            travel_style: 'solo',
            interests: ['Beaches', 'Hiking'],
            no_of_travelers: 2,
            budget: 1500,
            no_of_days: 5,
            start_date: '2026-09-01',
            end_date: '2026-09-06',
        }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, tags: { type: 'auth' } }
    );
    check(trip, { 'trip create 201': (r) => r.status === 201 });

    sleep(0.5);
}

export function load() {
    const token = loginToken();
    const headers = authedHeaders(token);

    for (let i = 0; i < 1; i++) {
        http.batch(PUBLIC_GETS.map((u) => ({ method: 'GET', url: BASE + u, params: { tags: { type: 'public' } } })));

        http.get(`${BASE}/user`, { headers, tags: { type: 'auth' } });
        http.get(`${BASE}/v1/trips/create`, { headers, tags: { type: 'auth' } });

        sleep(0.2);
    }
}