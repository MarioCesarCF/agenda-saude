import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
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
              <input
                type="password"
                [(ngModel)]="senha"
                name="senha"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            @if (erro) {
            <p class="text-red-500 text-sm">{{ erro }}</p>
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
              <input
                type="password"
                [(ngModel)]="cadSenha"
                name="cadSenha"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
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
  erro = '';
  sucesso = '';

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
    private cdr: ChangeDetectorRef,
  ) {}

  async entrar() {
    this.erro = '';
    this.auth.login(this.email, this.senha).subscribe({
      next: () => {
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
