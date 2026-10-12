import { Component, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-esqueci-senha',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <img src="logo_circ.png" alt="Agenda Saúde" class="w-20 h-20 mx-auto mb-3 rounded-full object-cover" />
          <h1 class="text-3xl font-bold text-emerald-600">Agenda Saúde</h1>
          <p class="text-gray-500 mt-2">Recuperação de senha</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border p-6">
          @if (enviado) {
          <div class="text-center space-y-4">
            <p class="text-emerald-600 font-medium">Código enviado!</p>
            <p class="text-gray-500 text-sm">
              Se o email estiver cadastrado, você receberá um código de recuperação.
            </p>
            <a
              routerLink="/login/resetar-senha"
              class="inline-block w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition text-center"
            >
              Já tenho o código
            </a>
          </div>
          } @else {
          <form (ngSubmit)="enviar()" class="space-y-4">
            <p class="text-gray-500 text-sm">
              Informe seu email para receber um código de recuperação de senha.
            </p>
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
            @if (erro) {
            <p class="text-red-500 text-sm">{{ erro }}</p>
            }
            <button
              type="submit"
              [disabled]="carregando"
              class="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {{ carregando ? 'Enviando...' : 'Enviar código' }}
            </button>
          </form>
          }
          <div class="mt-4 text-center">
            <a routerLink="/login" class="text-sm text-emerald-600 hover:underline">Voltar para o login</a>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: false,
})
export class EsqueciSenhaComponent {
  email = '';
  erro = '';
  enviado = false;
  carregando = false;

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  enviar() {
    this.erro = '';
    this.carregando = true;
    this.auth.solicitarReset(this.email).subscribe({
      next: () => {
        this.carregando = false;
        this.enviado = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Erro ao solicitar recuperação. Tente novamente.';
        this.cdr.detectChanges();
      },
    });
  }
}
