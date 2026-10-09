import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PacienteAuthService } from '../services/paciente-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const pacienteAuth = inject(PacienteAuthService);

  let token: string | null = null;
  if (req.url.includes('/api/pacientes/')) {
    token = pacienteAuth.token();
  } else {
    token = auth.token();
  }

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};