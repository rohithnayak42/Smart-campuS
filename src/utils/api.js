const TOKEN_KEY = 'sc_token';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
});

const handleResponse = async (res) => {
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message || 'Request failed');
    }
    return res.json().catch(() => ({}));
};

export const api = {
    /* Stats */
    getStats: () => fetch('/api/admin/stats', { headers: getHeaders() }).then(handleResponse),

    /* Users */
    getUsers: () => fetch('/api/admin/users', { headers: getHeaders() }).then(handleResponse),
    createUser: (data) => fetch('/api/admin/users', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    updateUser: (id, data) => fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deleteUser: (id) => fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(r => r.ok),
    resetPassword: (id, password) => fetch(`/api/admin/users/${id}/reset-password`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ password }) }).then(handleResponse),

    /* Subjects */
    getSubjects: () => fetch('/api/admin/subjects', { headers: getHeaders() }).then(handleResponse),
    createSubject: (data) => fetch('/api/admin/subjects', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    updateSubject: (id, data) => fetch(`/api/admin/subjects/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deleteSubject: (id) => fetch(`/api/admin/subjects/${id}`, { method: 'DELETE', headers: getHeaders() }).then(r => r.ok),

    /* Schedules */
    getSchedules: () => fetch('/api/admin/schedules', { headers: getHeaders() }).then(handleResponse),
    createSchedule: (data) => fetch('/api/admin/schedules', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

    /* Notices */
    getNotices: () => fetch('/api/admin/notices', { headers: getHeaders() }).then(handleResponse),
    createNotice: (data) => fetch('/api/admin/notices', { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

    /* Issues */
    getIssues: () => fetch('/api/admin/issues', { headers: getHeaders() }).then(handleResponse),
    resolveIssue: (id) => fetch(`/api/admin/issues/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status: 'Resolved' }) }).then(handleResponse),
};
