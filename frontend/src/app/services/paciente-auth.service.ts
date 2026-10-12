import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import type { GoogleLoginResponse, PacienteLoginRequest, PacienteLoginResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PacienteAuthService {
  private readonly apiUrl = 'http://localhost:5268/api/auth';
  readonly token = signal<string | null>(null);
  readonly pacienteId = signal<string>('');
  readonly nome = signal<string>('');
  readonly email = signal<string>('');
  readonly telefoneCelular = signal<string | null>(null);
  readonly consultorioId = signal<string>('');
  readonly slug = signal<string>('');

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('auth-paciente');
    if (saved) {
      const data = JSON.parse(saved) as PacienteLoginResponse;
      this.setAuth(data);
    }
  }

  login(consultorioId: string, email: string, senha: string) {
    return this.http
      .post<PacienteLoginResponse>(
        `${this.apiUrl}/login-paciente/${consultorioId}`,
        { email, senha } as PacienteLoginRequest,
      )
      .pipe(tap((res) => this.setAuth(res)));
  }

  cadastrar(consultorioId: string, data: { nome: string; email: string; telefoneCelular: string; senha: string }) {
    return this.http.post(`${this.apiUrl}/cadastro-paciente/${consultorioId}`, data);
  }

  refresh() {
    return this.http
      .post<PacienteLoginResponse>(
        `${this.apiUrl}/refresh-paciente`,
        { refreshToken: this.getRefreshToken() },
      )
      .pipe(tap((res) => this.setAuth(res)));
  }

  logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http
        .post(`${this.apiUrl}/logout-paciente`, { refreshToken })
        .subscribe({ next: () => {}, error: () => {} });
    }
    localStorage.removeItem('auth-paciente');
    this.token.set(null);
    this.pacienteId.set('');
    this.nome.set('');
    this.email.set('');
    this.telefoneCelular.set(null);
    this.consultorioId.set('');
    this.slug.set('');
  }

  aplicarLoginGoogle(data: GoogleLoginResponse) {
    this.setAuth({
      token: data.token,
      id: data.id,
      nome: data.nome,
      email: data.email,
      telefoneCelular: data.telefoneCelular,
      consultorioId: data.consultorioId,
      slug: data.slug,
      refreshToken: data.refreshToken,
    });
  }

  getRefreshToken(): string | null {
    const saved = localStorage.getItem('auth-paciente');
    if (!saved) return null;
    try {
      return (JSON.parse(saved) as PacienteLoginResponse).refreshToken ?? null;
    } catch {
      return null;
    }
  }

  isLoggedIn(consultorio?: string) {
    if (this.token() === null) return false;
    if (!consultorio) return true;
    return this.consultorioId() === consultorio || this.slug() === consultorio;
  }

  private setAuth(data: PacienteLoginResponse) {
    localStorage.setItem('auth-paciente', JSON.stringify(data));
    this.token.set(data.token);
    this.pacienteId.set(data.id);
    this.nome.set(data.nome);
    this.email.set(data.email ?? '');
    this.telefoneCelular.set(data.telefoneCelular ?? null);
    this.consultorioId.set(data.consultorioId);
    this.slug.set(data.slug ?? '');
  }
}
