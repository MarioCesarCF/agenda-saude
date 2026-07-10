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
            <input [(ngModel)]="senhaData.senhaAtual" name="senhaAtual" type="password"
              class="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
              [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
              [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
            />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Nova Senha</label>
            <input [(ngModel)]="senhaData.novaSenha" name="novaSenha" type="password" minlength="6"
              class="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
              [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
              [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
            />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Confirmar Nova Senha</label>
            <input [(ngModel)]="confirmarSenha" name="confirmarSenha" type="password"
              class="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
              [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
              [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
            />
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
