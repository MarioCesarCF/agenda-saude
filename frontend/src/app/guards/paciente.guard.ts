import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { PacienteAuthService } from '../services/paciente-auth.service';

export const PacienteGuard: CanActivateFn = (route, state) => {
  const pacienteAuth = inject(PacienteAuthService);
  const router = inject(Router);
  const consultorio = route.paramMap.get('consultorioId') ?? undefined;
  if (pacienteAuth.isLoggedIn(consultorio)) return true;
  router.navigate(['/p', consultorio, 'entrar'], {
    queryParams: { redirect: state.url },
  });
  return false;
};
