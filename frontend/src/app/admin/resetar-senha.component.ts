import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-resetar-senha',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <img src="logo_circ.png" alt="Agenda Saúde" class="w-20 h-20 mx-auto mb-3 rounded-full object-cover" />
          <h1 class="text-3xl font-bold text-emerald-600">Agenda Saúde</h1>
          <p class="text-gray-500 mt-2">Definir nova senha</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border p-6">
          <form (ngSubmit)="redefinir()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Código de recuperação</label>
              <input
                type="text"
                [(ngModel)]="token"
                name="token"
                required
                maxlength="6"
                class="w-full px-3 py-2 border rounded-lg text-sm tracking-widest text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <div class="relative">
                <input
                  [type]="mostrarNovaSenha ? 'text' : 'password'"
                  [(ngModel)]="novaSenha"
                  name="novaSenha"
                  required
                  class="w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <button type="button" (click)="mostrarNovaSenha = !mostrarNovaSenha"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <div class="relative">
                <input
                  [type]="mostrarConfirmarSenha ? 'text' : 'password'"
                  [(ngModel)]="confirmarSenha"
                  name="confirmarSenha"
                  required
                  class="w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <button type="button" (click)="mostrarConfirmarSenha = !mostrarConfirmarSenha"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                  [attr.aria-label]="mostrarConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'">
                  @if (mostrarConfirmarSenha) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>
                  } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  }
                </button>
              </div>
            </div>
            @if (erro) {
            <p class="text-red-500 text-sm">{{ erro }}</p>
            }
            <button
              type="submit"
              [disabled]="carregando"
              class="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {{ carregando ? 'Salvando...' : 'Redefinir senha' }}
            </button>
          </form>
          <div class="mt-4 text-center">
            <a routerLink="/login" class="text-sm text-emerald-600 hover:underline">Voltar para o login</a>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: false,
})
export class ResetarSenhaComponent implements OnInit {
  token = '';
  novaSenha = '';
  confirmarSenha = '';
  erro = '';
  carregando = false;
  mostrarNovaSenha = false;
  mostrarConfirmarSenha = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  redefinir() {
    this.erro = '';

    if (this.novaSenha.length < 6) {
      this.erro = 'A nova senha deve ter no mínimo 6 caracteres.';
      return;
    }
    if (this.novaSenha !== this.confirmarSenha) {
      this.erro = 'As senhas não conferem.';
      return;
    }

    this.carregando = true;
    this.auth.resetarSenha(this.token, this.novaSenha).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigate(['/login'], { queryParams: { reset: 'ok' } });
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Código inválido ou expirado.';
        this.cdr.detectChanges();
      },
    });
  }
}
