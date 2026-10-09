import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import type { PacienteLoginRequest, PacienteLoginResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PacienteAuthService {
  private readonly apiUrl = 'http://localhost:5268/api/auth';
  readonly token = signal<string | null>(null);
  readonly pacienteId = signal<string>('');
  readonly nome = signal<string>('');
  readonly email = signal<string>('');
  readonly telefoneCelular = signal<string | null>(null);
  readonly consultorioId = signal<string>('');

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

  logout() {
    localStorage.removeItem('auth-paciente');
    this.token.set(null);
    this.pacienteId.set('');
    this.nome.set('');
    this.email.set('');
    this.telefoneCelular.set(null);
    this.consultorioId.set('');
  }

  isLoggedIn(consultorioId?: string) {
    if (this.token() === null) return false;
    if (!consultorioId) return true;
    return this.consultorioId() === consultorioId;
  }

  private setAuth(data: PacienteLoginResponse) {
    localStorage.setItem('auth-paciente', JSON.stringify(data));
    this.token.set(data.token);
    this.pacienteId.set(data.id);
    this.nome.set(data.nome);
    this.email.set(data.email ?? '');
    this.telefoneCelular.set(data.telefoneCelular ?? null);
    this.consultorioId.set(data.consultorioId);
  }
}