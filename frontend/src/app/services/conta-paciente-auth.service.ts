import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import type {
  CadastroContaPacienteRequest,
  ContaPacienteLoginRequest,
  ContaPacienteResponse,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ContaPacienteAuthService {
  private readonly apiUrl = 'http://localhost:5268/api/auth';
  readonly token = signal<string | null>(null);
  readonly contaId = signal<string>('');
  readonly nome = signal<string>('');
  readonly email = signal<string>('');
  readonly telefoneCelular = signal<string | null>(null);

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('auth-conta-paciente');
    if (saved) {
      const data = JSON.parse(saved) as ContaPacienteResponse;
      this.setAuth(data);
    }
  }

  cadastrar(data: CadastroContaPacienteRequest) {
    return this.http.post<ContaPacienteResponse>(`${this.apiUrl}/cadastro-conta-paciente`, data).pipe(
      tap((res) => this.setAuth(res)),
    );
  }

  login(email: string, senha: string) {
    return this.http
      .post<ContaPacienteResponse>(`${this.apiUrl}/login-conta-paciente`, { email, senha } as ContaPacienteLoginRequest)
      .pipe(tap((res) => this.setAuth(res)));
  }

  refresh() {
    return this.http
      .post<ContaPacienteResponse>(`${this.apiUrl}/refresh-conta-paciente`, { refreshToken: this.getRefreshToken() })
      .pipe(tap((res) => this.setAuth(res)));
  }

  logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http
        .post(`${this.apiUrl}/logout-conta-paciente`, { refreshToken })
        .subscribe({ next: () => {}, error: () => {} });
    }
    localStorage.removeItem('auth-conta-paciente');
    this.token.set(null);
    this.contaId.set('');
    this.nome.set('');
    this.email.set('');
    this.telefoneCelular.set(null);
  }

  isLoggedIn() {
    return this.token() !== null;
  }

  getRefreshToken(): string | null {
    const saved = localStorage.getItem('auth-conta-paciente');
    if (!saved) return null;
    try {
      return (JSON.parse(saved) as ContaPacienteResponse).refreshToken ?? null;
    } catch {
      return null;
    }
  }

  private setAuth(data: ContaPacienteResponse) {
    localStorage.setItem('auth-conta-paciente', JSON.stringify(data));
    this.token.set(data.token);
    this.contaId.set(data.id);
    this.nome.set(data.nome);
    this.email.set(data.email);
    this.telefoneCelular.set(data.telefoneCelular ?? null);
  }
}