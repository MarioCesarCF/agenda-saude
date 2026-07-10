import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import type { LoginResponse } from '../models/models';

function mockLoginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    token: 'test-token-123',
    id: 'user-id-1',
    nome: 'Dr. Teste',
    email: 'teste@clinica.com',
    perfil: 'Admin',
    consultorioId: 'consultorio-id-1',
    nomeFantasia: 'Clinica Teste',
    tema: 'light',
    corPrimaria: '#059669',
    corSecundaria: '#10b981',
    corDestaque: '#f59e0b',
    diasAgenda: 2,
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerNavigateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    routerNavigateSpy = vi.fn();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: routerNavigateSpy } },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no token', () => {
    expect(service.token()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should restore auth from localStorage on construction', () => {
    const data = mockLoginResponse();
    localStorage.setItem('auth', JSON.stringify(data));

    const svc = new AuthService(
      { post: vi.fn().mockReturnValue({ subscribe: vi.fn() }) } as any,
      { navigate: routerNavigateSpy } as any,
    );
    expect(svc.token()).toBe(data.token);
    expect(svc.nome()).toBe(data.nome);
    expect(svc.perfil()).toBe(data.perfil);
    expect(svc.consultorioId()).toBe(data.consultorioId);
  });

  it('should call login and set auth signals', () => {
    const data = mockLoginResponse();

    service.login('teste@clinica.com', 'senha123').subscribe((res) => {
      expect(res.token).toBe(data.token);
      expect(service.token()).toBe(data.token);
      expect(service.nome()).toBe('Dr. Teste');
      expect(service.perfil()).toBe('Admin');
      expect(service.consultorioId()).toBe('consultorio-id-1');
      expect(service.isLoggedIn()).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:5268/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'teste@clinica.com', senha: 'senha123' });
    req.flush(data);
  });

  it('should store auth data in localStorage after login', () => {
    const data = mockLoginResponse();

    service.login('teste@clinica.com', 'senha123').subscribe();

    const req = httpMock.expectOne('http://localhost:5268/api/auth/login');
    req.flush(data);

    const stored = JSON.parse(localStorage.getItem('auth')!);
    expect(stored.token).toBe(data.token);
    expect(stored.nome).toBe(data.nome);
  });

  it('should clear auth on logout', () => {
    const data = mockLoginResponse();
    localStorage.setItem('auth', JSON.stringify(data));
    service['setAuth'](data);

    service.logout();

    const logoutReq = httpMock.expectOne('http://localhost:5268/api/auth/logout');
    expect(logoutReq.request.method).toBe('POST');
    logoutReq.flush({});

    expect(service.token()).toBeNull();
    expect(localStorage.getItem('auth')).toBeNull();
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should not call backend logout when no token', () => {
    service.logout();

    httpMock.expectNone('http://localhost:5268/api/auth/logout');
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should return true for isAdmin when perfil is Admin', () => {
    const data = mockLoginResponse({ perfil: 'Admin' });
    service['setAuth'](data);
    expect(service.isAdmin()).toBe(true);
  });

  it('should return false for isAdmin when perfil is Atendente', () => {
    const data = mockLoginResponse({ perfil: 'Atendente' });
    service['setAuth'](data);
    expect(service.isAdmin()).toBe(false);
  });

  it('should update theme signals and localStorage', () => {
    const data = mockLoginResponse();
    localStorage.setItem('auth', JSON.stringify(data));
    service['setAuth'](data);

    service.updateTheme({
      nomeFantasia: 'Nova Clinica',
      tema: 'dark',
      corPrimaria: '#ff0000',
      corSecundaria: '#00ff00',
      corDestaque: '#0000ff',
      icone: 'star',
      diasAgenda: 5,
    });

    expect(service.nomeFantasia()).toBe('Nova Clinica');
    expect(service.tema()).toBe('dark');
    expect(service.corPrimaria()).toBe('#ff0000');
    expect(service.corSecundaria()).toBe('#00ff00');
    expect(service.corDestaque()).toBe('#0000ff');
    expect(service.icone()).toBe('star');
    expect(service.diasAgenda()).toBe(5);

    const stored = JSON.parse(localStorage.getItem('auth')!);
    expect(stored.tema).toBe('dark');
    expect(stored.diasAgenda).toBe(5);
  });
});
