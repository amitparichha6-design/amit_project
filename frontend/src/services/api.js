const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Perform an authenticated HTTP request with JSON payload handling
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('campushire_token');
  const headers = {
    ...(options.headers || {}),
  };

  // Only default to application/json if not sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
    if (Array.isArray(errorMsg)) {
      errorMsg = errorMsg
        .map((err) => (typeof err === 'object' && err !== null ? err.msg || JSON.stringify(err) : String(err)))
        .join(', ');
    } else if (typeof errorMsg === 'object' && errorMsg !== null) {
      errorMsg = JSON.stringify(errorMsg);
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (registrationData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me', {
      method: 'GET',
    });
  },
};

export const dashboardApi = {
  getAdminDashboard: async () => {
    return apiRequest('/dashboard/admin', { method: 'GET' });
  },

  getStudentDashboard: async () => {
    return apiRequest('/dashboard/student', { method: 'GET' });
  },

  getCompanyDashboard: async () => {
    return apiRequest('/dashboard/company', { method: 'GET' });
  },

  getSummary: async () => {
    return apiRequest('/dashboard/summary', { method: 'GET' });
  },
};

export const adminApi = {
  // 1. Dashboard
  getDashboardStats: async () => {
    return apiRequest('/admin/dashboard', { method: 'GET' });
  },

  // 2. Company Management
  getCompanies: async (statusFilter = null) => {
    const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    return apiRequest(`/admin/companies${query}`, { method: 'GET' });
  },

  getCompanyDetails: async (companyId) => {
    return apiRequest(`/admin/companies/${companyId}`, { method: 'GET' });
  },

  approveOrRejectCompany: async (companyId, status, rejectionReason = null) => {
    return apiRequest(`/admin/companies/${companyId}/approval`, {
      method: 'POST',
      body: JSON.stringify({ status, rejection_reason: rejectionReason }),
    });
  },

  // 3. Student Management
  getStudents: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.department) searchParams.append('department', params.department);
    if (params.is_verified !== undefined && params.is_verified !== null && params.is_verified !== '') {
      searchParams.append('is_verified', params.is_verified);
    }
    if (params.search) searchParams.append('search', params.search);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/admin/students${queryString}`, { method: 'GET' });
  },

  getStudentDetails: async (studentId) => {
    return apiRequest(`/admin/students/${studentId}`, { method: 'GET' });
  },

  verifyStudent: async (studentId, isVerified, backlogs = 0, cgpa = null) => {
    return apiRequest(`/admin/students/${studentId}/verification`, {
      method: 'POST',
      body: JSON.stringify({ is_verified: isVerified, backlogs, cgpa }),
    });
  },

  // 4. Placement Drives & Eligibility Criteria
  getDrives: async () => {
    return apiRequest('/admin/drives', { method: 'GET' });
  },

  getDriveDetails: async (driveId) => {
    return apiRequest(`/admin/drives/${driveId}`, { method: 'GET' });
  },

  createDrive: async (driveData) => {
    return apiRequest('/admin/drives', {
      method: 'POST',
      body: JSON.stringify(driveData),
    });
  },

  updateDrive: async (driveId, driveData) => {
    return apiRequest(`/admin/drives/${driveId}`, {
      method: 'PUT',
      body: JSON.stringify(driveData),
    });
  },

  toggleDriveStatus: async (driveId) => {
    return apiRequest(`/admin/drives/${driveId}/toggle-status`, { method: 'PATCH' });
  },

  // 5. Job Management
  getJobs: async (companyId = null, isActive = null) => {
    const searchParams = new URLSearchParams();
    if (companyId) searchParams.append('company_id', companyId);
    if (isActive !== null && isActive !== undefined) searchParams.append('is_active', isActive);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/admin/jobs${queryString}`, { method: 'GET' });
  },

  createJob: async (jobData) => {
    return apiRequest('/admin/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  toggleJobStatus: async (jobId) => {
    return apiRequest(`/admin/jobs/${jobId}/toggle-status`, { method: 'PATCH' });
  },

  // 6. Notifications
  getNotifications: async () => {
    return apiRequest('/admin/notifications', { method: 'GET' });
  },

  createNotification: async (notificationData) => {
    return apiRequest('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  // 7. Reports
  getReports: async () => {
    return apiRequest('/admin/reports', { method: 'GET' });
  },

  // 8. Audit Logs
  getAuditLogs: async (limit = 100) => {
    return apiRequest(`/admin/audit-logs?limit=${limit}`, { method: 'GET' });
  },
};

export const studentApi = {
  // 1. Dashboard
  getDashboard: async () => {
    return apiRequest('/student/dashboard', { method: 'GET' });
  },

  // 2. Profile Management
  getProfile: async () => {
    return apiRequest('/student/profile', { method: 'GET' });
  },

  updateProfile: async (profileData) => {
    return apiRequest('/student/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // 3. Resume Upload & Download
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/student/resume', {
      method: 'POST',
      body: formData,
    });
  },

  getResumeDownloadUrl: () => {
    return `${API_BASE_URL}/student/resume/download`;
  },

  downloadResumeBlob: async () => {
    const token = localStorage.getItem('campushire_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/student/resume/download`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to download resume (HTTP ${response.status})`);
    }
    return response.blob();
  },

  // 4. Jobs & Eligibility
  getJobs: async (eligibleOnly = false) => {
    const query = eligibleOnly ? '?eligible_only=true' : '';
    return apiRequest(`/student/jobs${query}`, { method: 'GET' });
  },

  getJobDetail: async (jobId) => {
    return apiRequest(`/student/jobs/${jobId}`, { method: 'GET' });
  },

  // 5. Application Workflow
  applyJob: async (jobId, notes = '') => {
    return apiRequest(`/student/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  // 6. My Applications
  getApplications: async () => {
    return apiRequest('/student/applications', { method: 'GET' });
  },

  // 7. Notifications
  getNotifications: async () => {
    return apiRequest('/student/notifications', { method: 'GET' });
  },

  markNotificationRead: async (notificationId) => {
    return apiRequest(`/student/notifications/${notificationId}/read`, { method: 'PATCH' });
  },

  markAllNotificationsRead: async () => {
    return apiRequest('/student/notifications/read-all', { method: 'POST' });
  },
};
