import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PacienteAuthService } from './paciente-auth.service';
import type { PacienteLoginResponse } from '../models/models';

function mockPacienteLoginResponse(overrides: Partial<PacienteLoginResponse> = {}): PacienteLoginResponse {
  return {
    token: 'paciente-token-123',
    id: 'paciente-id-1',
    nome: 'João Paciente',
    email: 'joao@test.com',
    telefoneCelular: '11988888888',
    consultorioId: 'consultorio-id-1',
    ...overrides,
  };
}

describe('PacienteAuthService', () => {
  let service: PacienteAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PacienteAuthService);
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
    const data = mockPacienteLoginResponse();
    localStorage.setItem('auth-paciente', JSON.stringify(data));

    const svc = new PacienteAuthService({ post: vi.fn() } as any);
    expect(svc.token()).toBe(data.token);
    expect(svc.nome()).toBe(data.nome);
    expect(svc.consultorioId()).toBe(data.consultorioId);
  });

  it('should call login and set auth signals', () => {
    const data = mockPacienteLoginResponse();

    service.login('consultorio-id-1', 'joao@test.com', 'senha123').subscribe((res) => {
      expect(res.token).toBe(data.token);
      expect(service.token()).toBe(data.token);
      expect(service.nome()).toBe('João Paciente');
      expect(service.consultorioId()).toBe('consultorio-id-1');
      expect(service.isLoggedIn()).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:5268/api/auth/login-paciente/consultorio-id-1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'joao@test.com', senha: 'senha123' });
    req.flush(data);
  });

  it('should store auth data in localStorage after login', () => {
    const data = mockPacienteLoginResponse();

    service.login('consultorio-id-1', 'joao@test.com', 'senha123').subscribe();

    const req = httpMock.expectOne('http://localhost:5268/api/auth/login-paciente/consultorio-id-1');
    req.flush(data);

    const stored = JSON.parse(localStorage.getItem('auth-paciente')!);
    expect(stored.token).toBe(data.token);
    expect(stored.nome).toBe(data.nome);
  });

  it('should call cadastro endpoint', () => {
    service
      .cadastrar('consultorio-id-1', {
        nome: 'João Paciente',
        email: 'joao@test.com',
        telefoneCelular: '11988888888',
        senha: 'senha123',
      })
      .subscribe();

    const req = httpMock.expectOne('http://localhost:5268/api/auth/cadastro-paciente/consultorio-id-1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nome: 'João Paciente',
      email: 'joao@test.com',
      telefoneCelular: '11988888888',
      senha: 'senha123',
    });
    req.flush({ id: 'paciente-id-1', nome: 'João Paciente', email: 'joao@test.com' });
  });

  it('should clear auth on logout without backend call', () => {
    const data = mockPacienteLoginResponse();
    localStorage.setItem('auth-paciente', JSON.stringify(data));
    service['setAuth'](data);

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.nome()).toBe('');
    expect(localStorage.getItem('auth-paciente')).toBeNull();
  });

  it('should return true only for matching consultorioId', () => {
    const data = mockPacienteLoginResponse({ consultorioId: 'consultorio-id-1' });
    service['setAuth'](data);

    expect(service.isLoggedIn()).toBe(true);
    expect(service.isLoggedIn('consultorio-id-1')).toBe(true);
    expect(service.isLoggedIn('consultorio-id-2')).toBe(false);
  });
});