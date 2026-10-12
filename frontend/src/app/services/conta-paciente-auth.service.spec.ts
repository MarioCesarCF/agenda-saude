import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ContaPacienteAuthService } from './conta-paciente-auth.service';
import type { ContaPacienteResponse } from '../models/models';

function mockContaResponse(overrides: Partial<ContaPacienteResponse> = {}): ContaPacienteResponse {
  return {
    token: 'conta-token-123',
    id: 'conta-id-1',
    nome: 'Maria Paciente',
    email: 'maria@test.com',
    telefoneCelular: '11977777777',
    refreshToken: 'conta-refresh-123',
    ...overrides,
  };
}

describe('ContaPacienteAuthService', () => {
  let service: ContaPacienteAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ContaPacienteAuthService);
  });

  afterEach(() => {
    httpMock.verify();
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
    const data = mockContaResponse();
    localStorage.setItem('auth-conta-paciente', JSON.stringify(data));

    const svc = new ContaPacienteAuthService({ post: vi.fn() } as any);
    expect(svc.token()).toBe(data.token);
    expect(svc.nome()).toBe('Maria Paciente');
    expect(svc.email()).toBe('maria@test.com');
    expect(svc.isLoggedIn()).toBe(true);
  });

  it('should call login and set auth signals', () => {
    const data = mockContaResponse();

    service.login('maria@test.com', 'senha123').subscribe((res) => {
      expect(res.token).toBe(data.token);
      expect(service.token()).toBe(data.token);
      expect(service.nome()).toBe('Maria Paciente');
      expect(service.contaId()).toBe('conta-id-1');
      expect(service.isLoggedIn()).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:5268/api/auth/login-conta-paciente');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'maria@test.com', senha: 'senha123' });
    req.flush(data);
  });

  it('should store auth data in localStorage after login', () => {
    const data = mockContaResponse();

    service.login('maria@test.com', 'senha123').subscribe();

    const req = httpMock.expectOne('http://localhost:5268/api/auth/login-conta-paciente');
    req.flush(data);

    const stored = JSON.parse(localStorage.getItem('auth-conta-paciente')!);
    expect(stored.token).toBe(data.token);
    expect(stored.nome).toBe(data.nome);
  });

  it('should call cadastro endpoint', () => {
    service
      .cadastrar({
        nome: 'Maria Paciente',
        email: 'maria@test.com',
        telefoneCelular: '11977777777',
        senha: 'senha123',
      })
      .subscribe();

    const req = httpMock.expectOne('http://localhost:5268/api/auth/cadastro-conta-paciente');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nome: 'Maria Paciente',
      email: 'maria@test.com',
      telefoneCelular: '11977777777',
      senha: 'senha123',
    });
    req.flush(mockContaResponse());
  });

  it('should revoke session and clear auth on logout', () => {
    const data = mockContaResponse();
    localStorage.setItem('auth-conta-paciente', JSON.stringify(data));
    service['setAuth'](data);

    service.logout();

    const req = httpMock.expectOne('http://localhost:5268/api/auth/logout-conta-paciente');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'conta-refresh-123' });
    req.flush({});

    expect(service.token()).toBeNull();
    expect(service.nome()).toBe('');
    expect(localStorage.getItem('auth-conta-paciente')).toBeNull();
  });

  it('should refresh and update auth signals', () => {
    service['setAuth'](mockContaResponse());

    const data = mockContaResponse({ token: 'novo-token' });
    service.refresh().subscribe((res) => {
      expect(res.token).toBe('novo-token');
      expect(service.token()).toBe('novo-token');
    });

    const req = httpMock.expectOne('http://localhost:5268/api/auth/refresh-conta-paciente');
    expect(req.request.body).toEqual({ refreshToken: 'conta-refresh-123' });
    req.flush(data);
  });
});