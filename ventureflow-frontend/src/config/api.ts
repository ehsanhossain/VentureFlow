/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import axios from "axios";

/**
 * Serialize params in PHP/Laravel bracket format:
 *   - Arrays:  country[]=1&country[]=2       (not country[0]=1&country[1]=2)
 *   - Objects: ebitda[min]=100&ebitda[max]=500
 *   - Scalars: search=foo
 */
function serializeParams(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach(v => parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(v))}`));
    } else if (typeof value === 'object') {
      for (const [subKey, subVal] of Object.entries(value as Record<string, unknown>)) {
        if (subVal !== null && subVal !== undefined && subVal !== '') {
          parts.push(`${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(String(subVal))}`);
        }
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.join('&');
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/",
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  paramsSerializer: { serialize: serializeParams },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't show global alert for auth errors - let components handle them
    return Promise.reject(error);
  }
);

export default api;
