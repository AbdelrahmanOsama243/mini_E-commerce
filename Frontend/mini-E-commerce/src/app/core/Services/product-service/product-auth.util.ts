import { HttpHeaders } from '@angular/common/http';

export function getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
  return new HttpHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  });
}
