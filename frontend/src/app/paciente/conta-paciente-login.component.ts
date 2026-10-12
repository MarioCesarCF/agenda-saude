import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContaPacienteAuthService } from '../services/conta-paciente-auth.service';

const PRIMARIA = '#059669';

@Component({
  selector: 'app-conta-paciente-login',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div class="w-full max-w-md">
        <div class="text-center mb-6">
          <div class="text-5xl mb-2">🗓️</div>
          <h1 class="text-2xl font-bold text-slate-900">Agenda Saúde</h1>
          <p class="text-sm text-slate-500 mt-1">
            Sua área do paciente em todos os consultórios
          </p>
        </div>

        <div class="rounded-xl shadow-sm border border-slate-200 bg-white p-5">
          <div class="flex items-center gap-2 mb-4">
            <button (click)="modo = 'entrar'"
              class="flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
              [style.background-color]="modo === 'entrar' ? PRIMARIA : 'transparent'"
              [style.color]="modo === 'entrar' ? '#fff' : '#6b7280'">
              Entrar
            </button>
            <button (click)="modo = 'cadastro'"
              class="flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
              [style.background-color]="modo === 'cadastro' ? PRIMARIA : 'transparent'"
              [style.color]="modo === 'cadastro' ? '#fff' : '#6b7280'">
              Criar conta
            </button>
          </div>

          @if (modo === 'entrar') {
          <h2 class="font-semibold text-lg mb-1 text-slate-900">Acessar minha conta</h2>
          <p class="text-xs mb-4 text-slate-500">
            Veja os agendamentos de todos os consultórios em um só lugar.
          </p>

          <form (ngSubmit)="entrar()" #formEntrar="ngForm" class="space-y-3">
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-700">
                Email<span class="text-red-500">*</span>
              </label>
              <input type="email" [(ngModel)]="form.email" name="email" required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                [style.border-color]="emailInvalido ? '#ef4444' : ''"
                placeholder="seu@email.com">
              @if (emailInvalido) {
              <p class="text-xs text-red-500 mt-1">Informe um email válido</p>
              }
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-700">
                Senha<span class="text-red-500">*</span>
              </label>
              <input type="password" [(ngModel)]="form.senha" name="senha" required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                [style.border-color]="senhaInvalida ? '#ef4444' : ''"
                placeholder="••••••">
              @if (senhaInvalida) {
              <p class="text-xs text-red-500 mt-1">Informe sua senha (mínimo 6 caracteres)</p>
              }
            </div>

            @if (erro) {
            <p class="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{{ erro }}</p>
            }

            <button type="submit" [disabled]="carregando || !formEntrar.valid"
              class="w-full py-2.5 text-white rounded-lg font-medium text-sm transition disabled:opacity-50 cursor-pointer"
              [style.background-color]="PRIMARIA">
              {{ carregando ? 'Entrando…' : 'Entrar' }}
            </button>
          </form>
          } @else {
          <h2 class="font-semibold text-lg mb-1 text-slate-900">Criar conta de paciente</h2>
          <p class="text-xs mb-4 text-slate-500">
            Se já agendou em algum consultório com este email, os agendamentos aparecerão aqui.
          </p>

          <form (ngSubmit)="cadastrar()" #formCadastro="ngForm" class="space-y-3">
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-700">
                Nome completo<span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="form.nome" name="nome" required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                [style.border-color]="nomeInvalido ? '#ef4444' : ''"
                placeholder="Seu nome">
              @if (nomeInvalido) {
              <p class="text-xs text-red-500 mt-1">Informe seu nome</p>
              }
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-700">
                Email<span class="text-red-500">*</span>
              </label>
              <input type="email" [(ngModel)]="form.email" name="email" required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                [style.border-color]="emailInvalido ? '#ef4444' : ''"
                placeholder="seu@email.com">
              @if (emailInvalido) {
              <p class="text-xs text-red-500 mt-1">Informe um email válido</p>
              }
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-700">
                Celular<span class="text-red-500">*</span>
              </label>
              <input type="tel" [(ngModel)]="form.telefoneCelular" name="telefoneCelular" required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                [style.border-color]="celularInvalido ? '#ef4444' : ''"
                placeholder="(11) 99999-9999">
              @if (celularInvalido) {
              <p class="text-xs text-red-500 mt-1">Informe seu celular</p>
              }
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-700">
                Senha<span class="text-red-500">*</span>
              </label>
              <input type="password" [(ngModel)]="form.senha" name="senha" required minlength="6"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                [style.border-color]="senhaInvalida ? '#ef4444' : ''"
                placeholder="Mínimo 6 caracteres">
              @if (senhaInvalida) {
              <p class="text-xs text-red-500 mt-1">A senha deve ter pelo menos 6 caracteres</p>
              }
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-700">
                Confirmar senha<span class="text-red-500">*</span>
              </label>
              <input type="password" [(ngModel)]="form.confirmarSenha" name="confirmarSenha" required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                [style.border-color]="confirmarInvalida ? '#ef4444' : ''"
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
              [style.background-color]="PRIMARIA">
              {{ carregando ? 'Criando…' : 'Criar conta' }}
            </button>
          </form>
          }
        </div>

        <p class="text-xs text-center mt-4">
          <a (click)="voltar()" class="text-slate-500 underline cursor-pointer">← Voltar</a>
        </p>
      </div>
    </div>
  `,
  standalone: false,
})
export class ContaPacienteLoginComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contaPacienteAuth = inject(ContaPacienteAuthService);

  readonly PRIMARIA = PRIMARIA;

  redirect: string | null = null;
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
    this.redirect = this.route.snapshot.queryParams['redirect'] ?? null;
    if (this.contaPacienteAuth.isLoggedIn()) {
      this.destinoAposLogin();
    }
  }

  private destinoAposLogin() {
    if (this.redirect) {
      this.router.navigateByUrl(this.redirect);
    } else {
      this.router.navigate(['/paciente']);
    }
  }

  entrar() {
    this.submitted = true;
    this.erro = '';
    if (this.emailInvalido || this.senhaInvalida) return;

    this.carregando = true;
    this.contaPacienteAuth.login(this.form.email.trim(), this.form.senha).subscribe({
      next: () => {
        this.carregando = false;
        this.destinoAposLogin();
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
    if (
      this.nomeInvalido || this.emailInvalido || this.celularInvalido ||
      this.senhaInvalida || this.confirmarInvalida
    ) return;

    this.carregando = true;
    this.contaPacienteAuth
      .cadastrar({
        nome: this.form.nome.trim(),
        email: this.form.email.trim(),
        telefoneCelular: this.form.telefoneCelular.trim(),
        senha: this.form.senha,
      })
      .subscribe({
        next: () => {
          this.carregando = false;
          this.destinoAposLogin();
        },
        error: (err) => {
          this.carregando = false;
          if (err?.status === 409) {
            this.erro = 'Este email já possui uma conta. Tente fazer login.';
            this.modo = 'entrar';
          } else if (err?.status === 429) {
            this.erro = 'Muitas tentativas. Aguarde um instante e tente novamente.';
          } else if (err?.status === 0) {
            this.erro = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
          } else {
            this.erro = 'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.';
          }
        },
      });
  }

  voltar() {
    this.router.navigate(['/']);
  }
}