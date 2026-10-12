import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <img src="logo_circ.png" alt="Agenda Saúde" class="w-20 h-20 mx-auto mb-3 rounded-full object-cover" />
          <h1 class="text-3xl font-bold text-emerald-600">Agenda Saúde</h1>
          <p class="text-gray-500 mt-2">Sistema de Agendamento de Consultas</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border p-6">
          <ul class="flex mb-6 border-b">
            <li>
              <button
                class="px-4 py-2 -mb-px font-medium text-sm"
                [class.text-emerald-600]="aba === 'login'"
                [class.border-b-2]="aba === 'login'"
                [class.border-emerald-600]="aba === 'login'"
                (click)="aba = 'login'"
              >
                Entrar
              </button>
            </li>
            <li>
              <button
                class="px-4 py-2 -mb-px font-medium text-sm"
                [class.text-emerald-600]="aba === 'cadastro'"
                [class.border-b-2]="aba === 'cadastro'"
                [class.border-emerald-600]="aba === 'cadastro'"
                (click)="aba = 'cadastro'"
              >
                Cadastrar Consultório
              </button>
            </li>
          </ul>

          @if (aba === 'login') {
          <form (ngSubmit)="entrar()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div class="relative">
                <input
                  [type]="mostrarSenhaLogin ? 'text' : 'password'"
                  [(ngModel)]="senha"
                  name="senha"
                  required
                  class="w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <button type="button" (click)="mostrarSenhaLogin = !mostrarSenhaLogin"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                  [attr.aria-label]="mostrarSenhaLogin ? 'Ocultar senha' : 'Mostrar senha'">
                  @if (mostrarSenhaLogin) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>
                  } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  }
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" [(ngModel)]="lembrarEmail" name="lembrarEmail"
                  class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                Lembrar meu email
              </label>
              <a routerLink="/login/esqueci-senha" class="text-sm text-emerald-600 hover:underline"
                >Esqueci minha senha?</a
              >
            </div>
            @if (erro) {
            <p class="text-red-500 text-sm">{{ erro }}</p>
            } @if (sucesso) {
            <p class="text-emerald-600 text-sm">{{ sucesso }}</p>
            }
            <button
              type="submit"
              class="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              Entrar
            </button>
          </form>
          } @else {
          <form (ngSubmit)="cadastrar()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Nome do Consultório</label
              >
              <input
                type="text"
                [(ngModel)]="cadNome"
                name="cadNome"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                [(ngModel)]="cadEmail"
                name="cadEmail"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Celular</label>
              <input
                type="tel"
                [(ngModel)]="cadCelular"
                name="cadCelular"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div class="relative">
                <input
                  [type]="mostrarSenhaCad ? 'text' : 'password'"
                  [(ngModel)]="cadSenha"
                  name="cadSenha"
                  required
                  class="w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <button type="button" (click)="mostrarSenhaCad = !mostrarSenhaCad"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                  [attr.aria-label]="mostrarSenhaCad ? 'Ocultar senha' : 'Mostrar senha'">
                  @if (mostrarSenhaCad) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>
                  } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  }
                </button>
              </div>
            </div>
            <details class="text-xs text-gray-500">
              <summary class="cursor-pointer hover:text-emerald-600 font-medium">Configuração visual (opcional)</summary>
              <div class="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block font-medium mb-1">Primária</label>
                    <div class="flex items-center gap-1">
                      <input type="color" [(ngModel)]="cadCorPrimaria" name="cadCorPrimaria" class="w-8 h-8 rounded cursor-pointer border">
                      <span class="text-[10px] font-mono text-gray-400">{{ cadCorPrimaria }}</span>
                    </div>
                  </div>
                  <div>
                    <label class="block font-medium mb-1">Secundária</label>
                    <div class="flex items-center gap-1">
                      <input type="color" [(ngModel)]="cadCorSecundaria" name="cadCorSecundaria" class="w-8 h-8 rounded cursor-pointer border">
                      <span class="text-[10px] font-mono text-gray-400">{{ cadCorSecundaria }}</span>
                    </div>
                  </div>
                  <div>
                    <label class="block font-medium mb-1">Destaque</label>
                    <div class="flex items-center gap-1">
                      <input type="color" [(ngModel)]="cadCorDestaque" name="cadCorDestaque" class="w-8 h-8 rounded cursor-pointer border">
                      <span class="text-[10px] font-mono text-gray-400">{{ cadCorDestaque }}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block font-medium mb-1">Ícone</label>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" *ngFor="let op of iconeOptions"
                      (click)="cadIcone = op.value"
                      class="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded border text-[10px] transition"
                      [class.border-emerald-500]="cadIcone === op.value"
                      [class.bg-emerald-50]="cadIcone === op.value"
                      [class.border-gray-300]="cadIcone !== op.value">
                      <span class="text-base">{{ op.emoji }}</span>
                      <span>{{ op.label }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </details>
            @if (erro) {
            <p class="text-red-500 text-sm">{{ erro }}</p>
            } @if (sucesso) {
            <p class="text-emerald-600 text-sm">{{ sucesso }}</p>
            }
            <button
              type="submit"
              class="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              Criar Conta
            </button>
          </form>
          }
        </div>
      </div>
    </div>
  `,
  standalone: false,
})
export class LoginComponent {
  aba: 'login' | 'cadastro' = 'login';
  email = '';
  senha = '';
  lembrarEmail = false;
  erro = '';
  sucesso = '';
  mostrarSenhaLogin = false;
  mostrarSenhaCad = false;

  cadNome = '';
  cadEmail = '';
  cadCelular = '';
  cadSenha = '';
  cadCorPrimaria = '#059669';
  cadCorSecundaria = '#10b981';
  cadCorDestaque = '#f59e0b';
  cadIcone = '';

  iconeOptions = [
    { value: 'medico', label: 'Médico', emoji: '🩺' },
    { value: 'dentista', label: 'Dentista', emoji: '🦷' },
    { value: 'fisioterapia', label: 'Fisioterapia', emoji: '💪' },
    { value: 'psicologia', label: 'Psicologia', emoji: '🧠' },
    { value: 'nutricao', label: 'Nutrição', emoji: '🥗' },
    { value: '', label: 'Geral', emoji: '🏥' },
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {
    if (this.route.snapshot.queryParamMap.get('reset') === 'ok') {
      this.sucesso = 'Senha redefinida com sucesso! Faça login.';
    }
    this.email = this.auth.emailLembrado();
    this.lembrarEmail = !!this.email;
  }

  async entrar() {
    this.erro = '';
    this.auth.login(this.email, this.senha).subscribe({
      next: () => {
        if (this.lembrarEmail) {
          this.auth.salvarEmailLembrado(this.email);
        } else {
          this.auth.esquecerEmailLembrado();
        }
        this.cdr.detectChanges();
        this.router.navigate(['/admin/dashboard']);
      },
      error: () => {
        this.erro = 'Email ou senha inválidos';
        this.cdr.detectChanges();
      },
    });
  }

  async cadastrar() {
    this.erro = '';
    this.sucesso = '';
    this.auth
      .cadastrarConsultorio({
        nomeFantasia: this.cadNome,
        email: this.cadEmail,
        telefoneCelular: this.cadCelular,
        senha: this.cadSenha,
        corPrimaria: this.cadCorPrimaria,
        corSecundaria: this.cadCorSecundaria,
        corDestaque: this.cadCorDestaque,
        icone: this.cadIcone || null,
      })
      .subscribe({
        next: () => {
          this.sucesso = 'Consultório cadastrado! Faça login.';
          this.aba = 'login';
          this.cdr.detectChanges();
        },
        error: () => {
          this.erro = 'Erro ao cadastrar. Verifique os dados.';
          this.cdr.detectChanges();
        },
      });
  }
}
