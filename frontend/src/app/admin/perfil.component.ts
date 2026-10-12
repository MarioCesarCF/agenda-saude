import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-perfil',
  template: `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6" [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#1f2937'">Meu Perfil</h1>

      <div class="rounded-xl shadow-sm border p-6" [style.background-color]="auth.tema() === 'dark' ? '#111827' : '#ffffff'" [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Nome</label>
            <input [(ngModel)]="perfilData.nome" name="nome"
              class="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
              [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
              [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
            />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Email</label>
            <input [(ngModel)]="perfilData.email" name="email" type="email"
              class="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
              [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
              [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
            />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Perfil</label>
            <input [value]="perfilAtual" disabled
              class="w-full px-3 py-2 text-sm rounded-lg border opacity-60 cursor-not-allowed"
              [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
              [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
              [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
            />
          </div>
          @if (perfilMsg) {
          <p class="text-xs" [class.text-green-600]="perfilMsgTipo === 'ok'" [class.text-red-500]="perfilMsgTipo === 'erro'">{{ perfilMsg }}</p>
          }
          <button (click)="salvarPerfil()"
            class="px-4 py-2 text-sm text-white rounded-lg font-medium transition"
            [style.background-color]="auth.corPrimaria()"
          >Salvar Alterações</button>
        </div>
      </div>

      <div class="rounded-xl shadow-sm border p-6 mt-6" [style.background-color]="auth.tema() === 'dark' ? '#111827' : '#ffffff'" [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'">
        <h2 class="text-lg font-bold mb-4" [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'">Alterar Senha</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Senha Atual</label>
            <div class="relative">
              <input [(ngModel)]="senhaData.senhaAtual" name="senhaAtual" [type]="mostrarSenhaAtual ? 'text' : 'password'"
                class="w-full px-3 py-2 pr-10 text-sm rounded-lg border outline-none"
                [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
                [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
                [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
              />
              <button type="button" (click)="mostrarSenhaAtual = !mostrarSenhaAtual"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#9ca3af'"
                [attr.aria-label]="mostrarSenhaAtual ? 'Ocultar senha' : 'Mostrar senha'">
                @if (mostrarSenhaAtual) {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>
                } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                }
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Nova Senha</label>
            <div class="relative">
              <input [(ngModel)]="senhaData.novaSenha" name="novaSenha" [type]="mostrarNovaSenha ? 'text' : 'password'" minlength="6"
                class="w-full px-3 py-2 pr-10 text-sm rounded-lg border outline-none"
                [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
                [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
                [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
              />
              <button type="button" (click)="mostrarNovaSenha = !mostrarNovaSenha"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#9ca3af'"
                [attr.aria-label]="mostrarNovaSenha ? 'Ocultar senha' : 'Mostrar senha'">
                @if (mostrarNovaSenha) {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>
                } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                }
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Confirmar Nova Senha</label>
            <div class="relative">
              <input [(ngModel)]="confirmarSenha" name="confirmarSenha" [type]="mostrarConfirmarSenha ? 'text' : 'password'"
                class="w-full px-3 py-2 pr-10 text-sm rounded-lg border outline-none"
                [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
                [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
                [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
              />
              <button type="button" (click)="mostrarConfirmarSenha = !mostrarConfirmarSenha"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#9ca3af'"
                [attr.aria-label]="mostrarConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'">
                @if (mostrarConfirmarSenha) {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>
                } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                }
              </button>
            </div>
          </div>
          @if (senhaMsg) {
          <p class="text-xs" [class.text-green-600]="senhaMsgTipo === 'ok'" [class.text-red-500]="senhaMsgTipo === 'erro'">{{ senhaMsg }}</p>
          }
          <button (click)="alterarSenha()"
            class="px-4 py-2 text-sm text-white rounded-lg font-medium transition"
            [style.background-color]="auth.corDestaque()"
          >Alterar Senha</button>
        </div>
      </div>
    </div>
  `,
  standalone: false,
})
export class PerfilComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  perfilAtual = '';
  perfilData = { nome: '', email: '' };
  senhaData = { senhaAtual: '', novaSenha: '' };
  confirmarSenha = '';
  perfilMsg = '';
  perfilMsgTipo = '';
  senhaMsg = '';
  senhaMsgTipo = '';
  mostrarSenhaAtual = false;
  mostrarNovaSenha = false;
  mostrarConfirmarSenha = false;

  ngOnInit() {
    this.carregarPerfil();
  }

  carregarPerfil() {
    this.api.obterPerfil().subscribe({
      next: (res) => {
        this.perfilAtual = res.perfil;
        this.perfilData = { nome: res.nome, email: res.email };
        this.cdr.detectChanges();
      },
    });
  }

  salvarPerfil() {
    this.perfilMsg = '';
    this.api.atualizarPerfil(this.perfilData).subscribe({
      next: (res) => {
        this.perfilMsg = 'Perfil atualizado com sucesso';
        this.perfilMsgTipo = 'ok';
        this.auth.nome.set(res.nome);
        this.auth.email.set(res.email);
        const saved = localStorage.getItem('auth');
        if (saved) {
          const auth = JSON.parse(saved);
          auth.nome = res.nome;
          auth.email = res.email;
          localStorage.setItem('auth', JSON.stringify(auth));
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.perfilMsg = err.error?.erro || 'Erro ao atualizar perfil';
        this.perfilMsgTipo = 'erro';
        this.cdr.detectChanges();
      },
    });
  }

  alterarSenha() {
    this.senhaMsg = '';
    if (this.senhaData.novaSenha !== this.confirmarSenha) {
      this.senhaMsg = 'As senhas não conferem';
      this.senhaMsgTipo = 'erro';
      return;
    }
    if (this.senhaData.novaSenha.length < 6) {
      this.senhaMsg = 'A nova senha deve ter pelo menos 6 caracteres';
      this.senhaMsgTipo = 'erro';
      return;
    }
    this.api.alterarSenha(this.senhaData).subscribe({
      next: () => {
        this.senhaMsg = 'Senha alterada com sucesso';
        this.senhaMsgTipo = 'ok';
        this.senhaData = { senhaAtual: '', novaSenha: '' };
        this.confirmarSenha = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.senhaMsg = err.error?.erro || 'Erro ao alterar senha';
        this.senhaMsgTipo = 'erro';
        this.cdr.detectChanges();
      },
    });
  }
}
