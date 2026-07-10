import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import type { LoginRequest, LoginResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:5268/api/auth';
  readonly token = signal<string | null>(null);
  readonly usuarioId = signal<string>('');
  readonly nome = signal<string>('');
  readonly email = signal<string>('');
  readonly perfil = signal<string>('');
  readonly consultorioId = signal<string>('');
  readonly nomeFantasia = signal<string>('');
  readonly tema = signal<string>('light');
  readonly corPrimaria = signal<string>('#059669');
  readonly corSecundaria = signal<string>('#10b981');
  readonly corDestaque = signal<string>('#f59e0b');
  readonly icone = signal<string | null>(null);
  readonly diasAgenda = signal<number>(2);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const saved = localStorage.getItem('auth');
    if (saved) {
      const data = JSON.parse(saved) as LoginResponse;
      this.setAuth(data);
    }
  }

  login(email: string, senha: string) {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, senha } as LoginRequest)
      .pipe(tap((res) => this.setAuth(res)));
  }

  cadastrarConsultorio(data: any) {
    return this.http.post(`${this.apiUrl}/cadastro-consultorio`, data);
  }

  cadastrarPaciente(consultorioId: string, data: any) {
    return this.http.post(`${this.apiUrl}/cadastro-paciente/${consultorioId}`, data);
  }

  logout() {
    const token = this.token();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ next: () => {}, error: () => {} });
    }
    localStorage.removeItem('auth');
    this.token.set(null);
    this.router.navigate(['/login']);
  }

  updateTheme(data: { nomeFantasia: string; tema: string; corPrimaria: string; corSecundaria: string; corDestaque: string; icone: string | null; diasAgenda?: number }) {
    this.nomeFantasia.set(data.nomeFantasia);
    this.tema.set(data.tema);
    this.corPrimaria.set(data.corPrimaria);
    this.corSecundaria.set(data.corSecundaria);
    this.corDestaque.set(data.corDestaque);
    this.icone.set(data.icone);
    if (data.diasAgenda !== undefined) this.diasAgenda.set(data.diasAgenda);
    const saved = localStorage.getItem('auth');
    if (saved) {
      const auth = JSON.parse(saved);
      Object.assign(auth, data);
      localStorage.setItem('auth', JSON.stringify(auth));
    }
  }

  isLoggedIn() {
    return this.token() !== null;
  }

  isAdmin() {
    return this.perfil() === 'Admin';
  }

  private setAuth(data: LoginResponse) {
    localStorage.setItem('auth', JSON.stringify(data));
    this.token.set(data.token);
    this.usuarioId.set(data.id ?? '');
    this.nome.set(data.nome);
    this.email.set(data.email);
    this.perfil.set(data.perfil);
    this.consultorioId.set(data.consultorioId);
    this.nomeFantasia.set(data.nomeFantasia);
    this.tema.set(data.tema);
    this.corPrimaria.set(data.corPrimaria);
    this.corSecundaria.set(data.corSecundaria);
    this.corDestaque.set(data.corDestaque);
    this.icone.set(data.icone ?? null);
    this.diasAgenda.set(data.diasAgenda ?? 2);
  }
}
