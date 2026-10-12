import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { ContaPacienteAuthService } from '../services/conta-paciente-auth.service';

export const ContaPacienteGuard: CanActivateFn = (route, state) => {
  const contaPacienteAuth = inject(ContaPacienteAuthService);
  const router = inject(Router);
  if (contaPacienteAuth.isLoggedIn()) return true;
  router.navigate(['/paciente', 'entrar'], {
    queryParams: { redirect: state.url },
  });
  return false;
};