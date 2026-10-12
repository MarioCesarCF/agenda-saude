import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PacienteAuthService } from '../services/paciente-auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: AuthService;
  let pacienteAuthService: PacienteAuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService);
    pacienteAuthService = TestBed.inject(PacienteAuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header when token is set', () => {
    authService['setAuth']({
      token: 'my-jwt-token',
      id: '1',
      nome: 'Test',
      email: 'test@test.com',
      perfil: 'Admin',
      consultorioId: 'c1',
      nomeFantasia: 'Clinic',
      tema: 'light',
      corPrimaria: '#000',
      corSecundaria: '#111',
      corDestaque: '#222',
      diasAgenda: 2,
      slug: 'clinic',
      refreshToken: 'refresh-1',
    });

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
  });

  it('should not add Authorization header when no token', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should use patient token for /api/pacientes requests', () => {
    pacienteAuthService['setAuth']({
      token: 'paciente-jwt-token',
      id: 'p1',
      nome: 'João',
      email: 'joao@test.com',
      telefoneCelular: '11988888888',
      consultorioId: 'c1',
      slug: 'clinica',
      refreshToken: 'paciente-refresh-1',
    });

    httpClient.get('/api/pacientes/agendamentos').subscribe();

    const req = httpMock.expectOne('/api/pacientes/agendamentos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer paciente-jwt-token');
    req.flush([]);
  });

  it('should refresh admin token and retry on 401', () => {
    authService['setAuth']({
      token: 'old-admin-token',
      id: '1',
      nome: 'Test',
      email: 'test@test.com',
      perfil: 'Admin',
      consultorioId: 'c1',
      nomeFantasia: 'Clinic',
      tema: 'light',
      corPrimaria: '#000',
      corSecundaria: '#111',
      corDestaque: '#222',
      diasAgenda: 2,
      slug: 'clinic',
      refreshToken: 'refresh-1',
    });

    let resultado: unknown = null;
    httpClient.get('/api/test').subscribe((res) => (resultado = res));

    httpMock.expectOne('/api/test').flush({}, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne('http://localhost:5268/api/auth/refresh');
    expect(refreshReq.request.body).toEqual({ refreshToken: 'refresh-1' });
    refreshReq.flush({
      token: 'new-admin-token',
      id: '1',
      nome: 'Test',
      email: 'test@test.com',
      perfil: 'Admin',
      consultorioId: 'c1',
      nomeFantasia: 'Clinic',
      tema: 'light',
      corPrimaria: '#000',
      corSecundaria: '#111',
      corDestaque: '#222',
      diasAgenda: 2,
      slug: 'clinic',
      refreshToken: 'refresh-2',
    });

    const retryReq = httpMock.expectOne('/api/test');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-admin-token');
    retryReq.flush({ ok: true });

    expect(resultado).toEqual({ ok: true });
  });
});
