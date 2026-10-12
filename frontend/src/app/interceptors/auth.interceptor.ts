import type { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, shareReplay, switchMap, throwError, type Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PacienteAuthService } from '../services/paciente-auth.service';
import { ContaPacienteAuthService } from '../services/conta-paciente-auth.service';

let refreshAdmin$: Observable<unknown> | null = null;
let refreshPaciente$: Observable<unknown> | null = null;
let refreshConta$: Observable<unknown> | null = null;

function renovarAdmin(auth: AuthService): Observable<unknown> {
  refreshAdmin$ ??= auth.refresh().pipe(
    finalize(() => {
      refreshAdmin$ = null;
    }),
    shareReplay(1),
  );
  return refreshAdmin$;
}

function renovarPaciente(pacienteAuth: PacienteAuthService): Observable<unknown> {
  refreshPaciente$ ??= pacienteAuth.refresh().pipe(
    finalize(() => {
      refreshPaciente$ = null;
    }),
    shareReplay(1),
  );
  return refreshPaciente$;
}

function renovarConta(contaPacienteAuth: ContaPacienteAuthService): Observable<unknown> {
  refreshConta$ ??= contaPacienteAuth.refresh().pipe(
    finalize(() => {
      refreshConta$ = null;
    }),
    shareReplay(1),
  );
  return refreshConta$;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const pacienteAuth = inject(PacienteAuthService);
  const contaPacienteAuth = inject(ContaPacienteAuthService);

  const isPacienteApi = req.url.includes('/api/pacientes/');
  const isContaApi = req.url.includes('/api/conta-paciente/');
  const isAuthPath = req.url.includes('/api/auth/');

  const token = isContaApi
    ? contaPacienteAuth.token()
    : isPacienteApi
      ? pacienteAuth.token()
      : auth.token();

  const comToken = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(comToken).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthPath || !token) {
        return throwError(() => error);
      }

      const refresh$ = isContaApi
        ? renovarConta(contaPacienteAuth)
        : isPacienteApi
          ? renovarPaciente(pacienteAuth)
          : renovarAdmin(auth);

      return refresh$.pipe(
        switchMap(() => {
          const novoToken = isContaApi
            ? contaPacienteAuth.token()
            : isPacienteApi
              ? pacienteAuth.token()
              : auth.token();
          if (!novoToken) return throwError(() => error);
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${novoToken}` } }));
        }),
        catchError((err) => {
          if (isContaApi) contaPacienteAuth.logout();
          else if (isPacienteApi) pacienteAuth.logout();
          else auth.logout();
          return throwError(() => err);
        }),
      );
    }),
  );
};