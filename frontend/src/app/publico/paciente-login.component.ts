import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { PacienteAuthService } from '../services/paciente-auth.service';
import type { ConfiguracaoResponse } from '../models/models';

@Component({
  selector: 'app-paciente-login',
  template: `
    <div class="space-y-4" [class.dark]="config?.tema === 'dark'">

      <div class="rounded-xl shadow-sm border p-4"
        [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">

        <div class="flex items-center gap-2 mb-4">
          <button (click)="modo = 'entrar'"
            class="flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
            [style.background-color]="modo === 'entrar' ? (config?.corPrimaria ?? '#059669') : 'transparent'"
            [style.color]="modo === 'entrar' ? '#fff' : (config?.tema === 'dark' ? '#94a3b8' : '#6b7280')">
            Entrar
          </button>
          <button (click)="modo = 'cadastro'"
            class="flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
            [style.background-color]="modo === 'cadastro' ? (config?.corPrimaria ?? '#059669') : 'transparent'"
            [style.color]="modo === 'cadastro' ? '#fff' : (config?.tema === 'dark' ? '#94a3b8' : '#6b7280')">
            Criar conta
          </button>
        </div>

        @if (modo === 'entrar') {
        <h2 class="font-semibold text-lg mb-1" [style.color]="config?.tema === 'dark' ? '#f8fafc' : '#111827'">
          Acessar minha agenda
        </h2>
        <p class="text-xs mb-4" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
          Consulte seus agendamentos e cancele quando precisar.
        </p>

        <form (ngSubmit)="entrar()" #formEntrar="ngForm" class="space-y-3">
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">
              Email<span class="text-red-500">*</span>
            </label>
            <input type="email" [(ngModel)]="form.email" name="email" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark'"
              [class.text-white]="config?.tema === 'dark'"
              [style.border-color]="emailInvalido ? '#ef4444' : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
              placeholder="seu@email.com">
            @if (emailInvalido) {
            <p class="text-xs text-red-500 mt-1">Informe um email válido</p>
            }
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">
              Senha<span class="text-red-500">*</span>
            </label>
            <input type="password" [(ngModel)]="form.senha" name="senha" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark'"
              [class.text-white]="config?.tema === 'dark'"
              [style.border-color]="senhaInvalida ? '#ef4444' : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
              placeholder="••••••">
            @if (senhaInvalida) {
            <p class="text-xs text-red-500 mt-1">Informe sua senha</p>
            }
          </div>

          @if (erro) {
          <p class="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{{ erro }}</p>
          }

          <button type="submit" [disabled]="carregando || !formEntrar.valid"
            class="w-full py-2.5 text-white rounded-lg font-medium text-sm transition disabled:opacity-50 cursor-pointer"
            [style.background-color]="config?.corPrimaria ?? '#059669'">
            {{ carregando ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>
        } @else {
        <h2 class="font-semibold text-lg mb-1" [style.color]="config?.tema === 'dark' ? '#f8fafc' : '#111827'">
          Criar conta de paciente
        </h2>
        <p class="text-xs mb-4" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
          Se já agendou com este email, a senha será ativada na sua conta existente.
        </p>

        <form (ngSubmit)="cadastrar()" #formCadastro="ngForm" class="space-y-3">
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">
              Nome completo<span class="text-red-500">*</span>
            </label>
            <input type="text" [(ngModel)]="form.nome" name="nome" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark'"
              [class.text-white]="config?.tema === 'dark'"
              [style.border-color]="nomeInvalido ? '#ef4444' : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
              placeholder="Seu nome">
            @if (nomeInvalido) {
            <p class="text-xs text-red-500 mt-1">Informe seu nome</p>
            }
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">
              Email<span class="text-red-500">*</span>
            </label>
            <input type="email" [(ngModel)]="form.email" name="email" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark'"
              [class.text-white]="config?.tema === 'dark'"
              [style.border-color]="emailInvalido ? '#ef4444' : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
              placeholder="seu@email.com">
            @if (emailInvalido) {
            <p class="text-xs text-red-500 mt-1">Informe um email válido</p>
            }
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">
              Celular<span class="text-red-500">*</span>
            </label>
            <input type="tel" [(ngModel)]="form.telefoneCelular" name="telefoneCelular" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark'"
              [class.text-white]="config?.tema === 'dark'"
              [style.border-color]="celularInvalido ? '#ef4444' : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
              placeholder="(11) 99999-9999">
            @if (celularInvalido) {
            <p class="text-xs text-red-500 mt-1">Informe seu celular</p>
            }
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">
              Senha<span class="text-red-500">*</span>
            </label>
            <input type="password" [(ngModel)]="form.senha" name="senha" required minlength="6"
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark'"
              [class.text-white]="config?.tema === 'dark'"
              [style.border-color]="senhaInvalida ? '#ef4444' : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
              placeholder="Mínimo 6 caracteres">
            @if (senhaInvalida) {
            <p class="text-xs text-red-500 mt-1">A senha deve ter pelo menos 6 caracteres</p>
            }
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">
              Confirmar senha<span class="text-red-500">*</span>
            </label>
            <input type="password" [(ngModel)]="form.confirmarSenha" name="confirmarSenha" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark'"
              [class.text-white]="config?.tema === 'dark'"
              [style.border-color]="confirmarInvalida ? '#ef4444' : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
              placeholder="Repita a senha">
            @if (confirmarInvalida) {
            <p class="text-xs text-red-500 mt-1">As senhas não conferem</p>
            }
          </div>

          @if (erro) {
          <p class="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{{ erro }}</p>
          }
          @if (sucesso) {
          <p class="text-xs text-emerald-500 bg-emerald-500/10 rounded-lg px-3 py-2">{{ sucesso }}</p>
          }

          <button type="submit" [disabled]="carregando"
            class="w-full py-2.5 text-white rounded-lg font-medium text-sm transition disabled:opacity-50 cursor-pointer"
            [style.background-color]="config?.corPrimaria ?? '#059669'">
            {{ carregando ? 'Criando…' : 'Criar conta' }}
          </button>
        </form>
        }
      </div>

      <p class="text-xs text-center" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
        <a (click)="voltarAgendamento()" class="underline cursor-pointer">← Voltar para o agendamento</a>
      </p>
    </div>
  `,
  standalone: false,
})
export class PacienteLoginComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private pacienteAuth = inject(PacienteAuthService);

  consultorioId = '';
  config: ConfiguracaoResponse | null = null;
  modo: 'entrar' | 'cadastro' = 'entrar';
  carregando = false;
  erro = '';
  sucesso = '';
  submitted = false;

  form = {
    nome: '',
    email: '',
    telefoneCelular: '',
    senha: '',
    confirmarSenha: '',
  };

  get emailInvalido(): boolean {
    return this.submitted && (!this.form.email.trim() || !/.+@.+\..+/.test(this.form.email));
  }

  get senhaInvalida(): boolean {
    return this.submitted && (!this.form.senha || this.form.senha.length < 6);
  }

  get nomeInvalido(): boolean {
    return this.submitted && !this.form.nome.trim();
  }

  get celularInvalido(): boolean {
    return this.submitted && !this.form.telefoneCelular.trim();
  }

  get confirmarInvalida(): boolean {
    return this.submitted && (!this.form.confirmarSenha || this.form.confirmarSenha !== this.form.senha);
  }

  ngOnInit() {
    this.consultorioId = this.route.snapshot.params['consultorioId'];
    this.api.getConfiguracaoPublica(this.consultorioId).subscribe({
      next: (res) => {
        this.config = res;
      },
    });
  }

  entrar() {
    this.submitted = true;
    this.erro = '';
    if (this.emailInvalido || this.senhaInvalida) return;

    this.carregando = true;
    this.pacienteAuth.login(this.consultorioId, this.form.email, this.form.senha).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigate(['/p', this.consultorioId, 'minha-agenda']);
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Email ou senha inválidos';
      },
    });
  }

  cadastrar() {
    this.submitted = true;
    this.erro = '';
    this.sucesso = '';
    if (this.nomeInvalido || this.emailInvalido || this.celularInvalido || this.senhaInvalida || this.confirmarInvalida) return;

    this.carregando = true;
    this.pacienteAuth.cadastrar(this.consultorioId, {
      nome: this.form.nome,
      email: this.form.email,
      telefoneCelular: this.form.telefoneCelular,
      senha: this.form.senha,
    }).subscribe({
      next: () => {
        this.carregando = false;
        this.pacienteAuth.login(this.consultorioId, this.form.email, this.form.senha).subscribe({
          next: () => this.router.navigate(['/p', this.consultorioId, 'minha-agenda']),
          error: () => {
            this.sucesso = 'Conta criada! Entre com seus dados.';
            this.modo = 'entrar';
            this.submitted = false;
          },
        });
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Este email já possui senha cadastrada neste consultório';
      },
    });
  }

  voltarAgendamento() {
    this.router.navigate(['/p', this.consultorioId]);
  }
}