import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-resetar-senha',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
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
              <input
                type="password"
                [(ngModel)]="novaSenha"
                name="novaSenha"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <input
                type="password"
                [(ngModel)]="confirmarSenha"
                name="confirmarSenha"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
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
