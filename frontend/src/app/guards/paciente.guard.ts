import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { PacienteAuthService } from '../services/paciente-auth.service';

export const PacienteGuard: CanActivateFn = (route) => {
  const pacienteAuth = inject(PacienteAuthService);
  const router = inject(Router);
  const consultorioId = route.paramMap.get('consultorioId') ?? undefined;
  if (pacienteAuth.isLoggedIn(consultorioId)) return true;
  router.navigate(['/p', consultorioId, 'entrar']);
  return false;
};