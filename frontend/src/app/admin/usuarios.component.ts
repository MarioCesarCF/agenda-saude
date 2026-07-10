import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import type { Usuario } from '../models/models';

@Component({
  selector: 'app-usuarios',
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold" [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#1f2937'">Usuários</h1>
        <button
          (click)="abrirModalCriar()"
          class="px-4 py-2 text-sm text-white rounded-lg font-medium transition"
          [style.background-color]="auth.corPrimaria()"
          (mouseenter)="$any($event.target).style.filter = 'brightness(0.9)'"
          (mouseleave)="$any($event.target).style.filter = ''"
        >+ Novo Usuário</button>
      </div>

      <div class="rounded-xl shadow-sm border overflow-hidden" [style.background-color]="auth.tema() === 'dark' ? '#111827' : '#ffffff'" [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'">
        <table class="w-full text-sm">
          <thead>
            <tr [style.border-bottom-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'" style="border-bottom: 1px solid">
              <th class="text-left px-4 py-3 font-medium" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Nome</th>
              <th class="text-left px-4 py-3 font-medium" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Email</th>
              <th class="text-left px-4 py-3 font-medium" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Perfil</th>
              <th class="text-left px-4 py-3 font-medium" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Status</th>
              <th class="text-right px-4 py-3 font-medium" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (u of usuarios; track u.id) {
            <tr [style.border-bottom-color]="auth.tema() === 'dark' ? '#1f2937' : '#f3f4f6'" style="border-bottom: 1px solid">
              <td class="px-4 py-3 font-medium" [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'">{{ u.nome }}</td>
              <td class="px-4 py-3" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">{{ u.email }}</td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-1 rounded-full font-medium"
                  [class.bg-blue-50]="u.perfil === 'Admin'"
                  [class.text-blue-700]="u.perfil === 'Admin'"
                  [class.bg-green-50]="u.perfil === 'Atendente'"
                  [class.text-green-700]="u.perfil === 'Atendente'"
                  [class.bg-purple-50]="u.perfil === 'Profissional'"
                  [class.text-purple-700]="u.perfil === 'Profissional'"
                >{{ u.perfil }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-1 rounded-full font-medium"
                  [class.bg-green-50]="u.ativo"
                  [class.text-green-700]="u.ativo"
                  [class.bg-red-50]="!u.ativo"
                  [class.text-red-700]="!u.ativo"
                >{{ u.ativo ? 'Ativo' : 'Inativo' }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex gap-1 justify-end">
                  <button
                    (click)="abrirModalEditar(u)"
                    class="px-2 py-1 text-xs rounded-lg transition"
                    [style.color]="auth.corPrimaria()"
                    [style.background-color]="rgbaPrimaria(0.1)"
                  >Editar</button>
                  @if (u.id !== auth.usuarioId()) {
                  <button
                    (click)="excluir(u)"
                    class="px-2 py-1 text-xs rounded-lg transition text-red-700 bg-red-50 hover:bg-red-100"
                  >Excluir</button>
                  }
                </div>
              </td>
            </tr>
            }
          </tbody>
        </table>
        @if (usuarios.length === 0) {
        <p class="text-center py-8" [style.color]="auth.tema() === 'dark' ? '#6b7280' : '#9ca3af'">Nenhum usuário cadastrado</p>
        }
      </div>

      @if (modalAberto) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.5)">
        <div class="rounded-xl shadow-xl w-full max-w-md p-6" [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#ffffff'">
          <h2 class="text-lg font-bold mb-4" [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'">
            {{ editando ? 'Editar Usuário' : 'Novo Usuário' }}
          </h2>
          <form (submit)="salvar($event)">
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Nome</label>
                <input [(ngModel)]="formData.nome" name="nome" required
                  class="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
                  [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
                  [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
                />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Email</label>
                <input [(ngModel)]="formData.email" name="email" type="email" required
                  class="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
                  [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
                  [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
                />
              </div>
              @if (!editando) {
              <div>
                <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Senha</label>
                <input [(ngModel)]="formData.senha" name="senha" type="password" required minlength="6"
                  class="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
                  [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
                  [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
                />
              </div>
              }
              <div>
                <label class="block text-xs font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Perfil</label>
                <select [(ngModel)]="formData.perfil" name="perfil"
                  class="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#ffffff'"
                  [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'"
                  [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
                >
                  <option value="Admin">Admin</option>
                  <option value="Atendente">Atendente</option>
                </select>
              </div>
            </div>
            @if (erroMsg) {
            <p class="text-red-500 text-xs mt-2">{{ erroMsg }}</p>
            }
            <div class="flex gap-2 mt-4 justify-end">
              <button type="button" (click)="fecharModal()"
                class="px-4 py-2 text-sm rounded-lg border transition"
                [style.color]="auth.tema() === 'dark' ? '#d1d5db' : '#374151'"
                [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
              >Cancelar</button>
              <button type="submit"
                class="px-4 py-2 text-sm text-white rounded-lg font-medium transition"
                [style.background-color]="auth.corPrimaria()"
              >Salvar</button>
            </div>
          </form>
        </div>
      </div>
      }
    </div>
  `,
  standalone: false,
})
export class UsuariosComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  modalAberto = false;
  editando = false;
  editandoId = '';
  erroMsg = '';
  formData = { nome: '', email: '', senha: '', perfil: 'Atendente' };

  ngOnInit() {
    this.carregarUsuarios();
  }

  carregarUsuarios() {
    this.api.getUsuarios().subscribe({
      next: (res) => { this.usuarios = res; this.cdr.detectChanges(); },
      error: (err) => console.error('Erro ao carregar usuários:', err),
    });
  }

  rgbaPrimaria(opacity: number): string {
    const hex = this.auth.corPrimaria();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  abrirModalCriar() {
    this.editando = false;
    this.editandoId = '';
    this.erroMsg = '';
    this.formData = { nome: '', email: '', senha: '', perfil: 'Atendente' };
    this.modalAberto = true;
  }

  abrirModalEditar(u: Usuario) {
    this.editando = true;
    this.editandoId = u.id;
    this.erroMsg = '';
    this.formData = { nome: u.nome, email: u.email, senha: '', perfil: u.perfil };
    this.modalAberto = true;
  }

  fecharModal() {
    this.modalAberto = false;
    this.erroMsg = '';
  }

  salvar(e: Event) {
    e.preventDefault();
    if (this.editando) {
      this.api.atualizarUsuario(this.editandoId, {
        nome: this.formData.nome,
        email: this.formData.email,
        perfil: this.formData.perfil,
      }).subscribe({
        next: () => { this.fecharModal(); this.carregarUsuarios(); },
        error: (err) => { this.erroMsg = err.error?.erro || 'Erro ao salvar'; },
      });
    } else {
      this.api.criarUsuario({
        nome: this.formData.nome,
        email: this.formData.email,
        senha: this.formData.senha,
        perfil: this.formData.perfil,
      }).subscribe({
        next: () => { this.fecharModal(); this.carregarUsuarios(); },
        error: (err) => { this.erroMsg = err.error?.erro || 'Erro ao criar'; },
      });
    }
  }

  excluir(u: Usuario) {
    if (!confirm(`Excluir usuário "${u.nome}"?`)) return;
    this.api.excluirUsuario(u.id).subscribe({
      next: () => this.carregarUsuarios(),
      error: (err) => alert(err.error?.erro || 'Erro ao excluir'),
    });
  }
}
