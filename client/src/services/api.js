const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Universal fetch wrapper for API communication with ExamForge backend
 */
export const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('examforge_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(fullUrl, config);
    const contentType = response.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const rawText = await response.text();
      const error = new Error(`Backend server returned non-JSON response (${response.status}). Please ensure the ExamForge API server is running and accessible.`);
      error.status = response.status;
      error.code = 'NON_JSON_RESPONSE';
      error.rawText = rawText;
      throw error;
    }

    if (!response.ok) {
      const error = new Error(data.message || 'An error occurred during API request.');
      error.status = response.status;
      error.code = data.code || 'API_ERROR';
      error.errors = data.errors || [];
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to the ExamForge API server. Please ensure the backend server is active and accessible.');
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    }
    throw error;
  }
};

export const api = {
  get: (endpoint, headers) => request(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) => request(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body, headers) => request(endpoint, { method: 'PUT', body, headers }),
  patch: (endpoint, body, headers) => request(endpoint, { method: 'PATCH', body, headers }),
  delete: (endpoint, headers) => request(endpoint, { method: 'DELETE', headers }),
};
