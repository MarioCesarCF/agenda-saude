import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import type { Profissional, Servico, ProfissionalServico } from '../models/models';

@Component({
  selector: 'app-profissionais',
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">Profissionais</h1>
        <button
          (click)="nova()"
          [style.background-color]="auth.corPrimaria()"
          class="px-4 py-2 text-white rounded-lg text-sm"
        >
          + Novo Profissional
        </button>
      </div>

      @if (mostrarForm) {
      <div class="rounded-xl shadow-sm border p-4 mb-6"
        [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="auth.tema() === 'dark' ? '#334155' : '#e5e7eb'">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#374151'">{{ editandoId ? 'Editar' : 'Novo' }} Profissional</h2>
          <button
            type="button"
            (click)="cancelarEdicao()"
            class="text-gray-400 hover:text-gray-600 text-sm"
          >✕</button>
        </div>
        <form (ngSubmit)="salvar()" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Nome</label>
              <input
                type="text"
                [(ngModel)]="formNome"
                name="nome"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2"
                [class.bg-slate-700]="auth.tema() === 'dark'"
                [class.border-slate-600]="auth.tema() === 'dark'"
                [class.text-white]="auth.tema() === 'dark'"
                [style.--tw-ring-color]="auth.corSecundaria()"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Celular</label>
              <input
                type="tel"
                [(ngModel)]="formCelular"
                name="celular"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2"
                [class.bg-slate-700]="auth.tema() === 'dark'"
                [class.border-slate-600]="auth.tema() === 'dark'"
                [class.text-white]="auth.tema() === 'dark'"
                [style.--tw-ring-color]="auth.corSecundaria()"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1"
                [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Especialidade</label>
              <input
                type="text"
                [(ngModel)]="formEspecialidade"
                name="especialidade"
                class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2"
                [class.bg-slate-700]="auth.tema() === 'dark'"
                [class.border-slate-600]="auth.tema() === 'dark'"
                [class.text-white]="auth.tema() === 'dark'"
                [style.--tw-ring-color]="auth.corSecundaria()"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1"
                [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Registro (CRM/CRO)</label>
              <input
                type="text"
                [(ngModel)]="formRegistro"
                name="registro"
                class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2"
                [class.bg-slate-700]="auth.tema() === 'dark'"
                [class.border-slate-600]="auth.tema() === 'dark'"
                [class.text-white]="auth.tema() === 'dark'"
                [style.--tw-ring-color]="auth.corSecundaria()"
              />
            </div>
          </div>
          <div class="flex gap-2">
            <button
              type="submit"
              [style.background-color]="auth.corPrimaria()"
              class="px-4 py-2 text-white rounded-lg text-sm"
            >
              {{ editandoId ? 'Atualizar' : 'Salvar' }}
            </button>
            <button
              type="button"
              (click)="cancelarEdicao()"
              class="px-4 py-2 border rounded-lg text-sm transition"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [class.text-white]="auth.tema() === 'dark'"
              [class.hover:bg-slate-700]="auth.tema() === 'dark'"
              [class.border-gray-300]="auth.tema() !== 'dark'"
              [class.hover:bg-gray-50]="auth.tema() !== 'dark'">
              Cancelar
            </button>
          </div>
        </form>
      </div>
      }

      <div class="rounded-xl shadow-sm border"
        [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="auth.tema() === 'dark' ? '#334155' : '#e5e7eb'">
        @for (prof of profissionais; track prof.id) {
        <div class="flex items-center gap-4 p-4 border-b last:border-0"
          [style.border-color]="auth.tema() === 'dark' ? '#334155' : '#e5e7eb'">
          <div
            [style.background-color]="auth.corDestaque() + '1a'"
            [style.color]="auth.corDestaque()"
            class="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
          >
            {{ prof.nome[0] }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">{{ prof.nome }}</div>
            <div class="text-sm truncate" [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">
              {{ prof.especialidade || "Sem especialidade" }}
              @if (prof.registroProfissional) {
              <span class="ml-2 text-xs px-2 py-0.5 rounded"
                [style.background-color]="auth.tema() === 'dark' ? '#334155' : '#f3f4f6'">{{
                prof.registroProfissional
              }}</span>
              }
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <button
              type="button"
              (click)="abrirVinculos(prof)"
              title="Vincular serviços"
              class="p-1.5 rounded-lg transition"
              [style.color]="hoveredVinculoId === prof.id ? auth.corPrimaria() : '#9ca3af'"
              [style.background-color]="hoveredVinculoId === prof.id ? auth.corPrimaria() + '1a' : 'transparent'"
              (mouseenter)="hoveredVinculoId = prof.id"
              (mouseleave)="hoveredVinculoId = null"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
            <button
              type="button"
              (click)="editar(prof)"
              title="Editar profissional"
              class="p-1.5 rounded-lg transition"
              [style.color]="hoveredEditId === prof.id ? auth.corDestaque() : '#9ca3af'"
              [style.background-color]="hoveredEditId === prof.id ? auth.corDestaque() + '1a' : 'transparent'"
              (mouseenter)="hoveredEditId = prof.id"
              (mouseleave)="hoveredEditId = null"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
            <button
              type="button"
              (click)="excluir(prof)"
              title="Excluir profissional"
              class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                <line x1="10" x2="10" y1="11" y2="17"/>
                <line x1="14" x2="14" y1="11" y2="17"/>
              </svg>
            </button>
          </div>
        </div>
        } @empty {
        <p class="text-center py-8" [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">Nenhum profissional cadastrado</p>
        }
      </div>
    </div>

    <!-- Vínculo Modal -->
    @if (mostrarVinculo) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      (click)="fecharVinculo()">
      <div class="rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
        [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="auth.tema() === 'dark' ? '#334155' : '#e5e7eb'"
        (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">Vincular Serviços</h2>
          <button (click)="fecharVinculo()" class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <p class="text-sm mb-3" [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">
          Selecione os serviços que <strong [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">{{ vinculoProfNome }}</strong> pode realizar. Se nenhum for selecionado, todos os serviços aparecerão para o paciente.
        </p>
        <div class="space-y-2 mb-4">
          @for (serv of vinculoServicos; track serv.id) {
          <label class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm"
            [style.border-color]="vinculoSelecionados[serv.id] ? auth.corPrimaria() : (auth.tema() === 'dark' ? '#334155' : '#e5e7eb')"
            [style.background-color]="vinculoSelecionados[serv.id] ? auth.corPrimaria() + '0a' : (auth.tema() === 'dark' ? '#1e293b' : '#fff')">
            <input type="checkbox" [(ngModel)]="vinculoSelecionados[serv.id]"
              class="w-4 h-4 rounded"
              [style.accent-color]="auth.corPrimaria()">
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">{{ serv.nome }}</div>
              <div class="text-xs" [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">{{ serv.duracaoMinutos }}min · R$ {{ serv.preco.toFixed(2) }}</div>
            </div>
          </label>
          } @empty {
          <p class="text-sm text-center py-4" [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">Nenhum serviço cadastrado</p>
          }
        </div>
        <div class="flex gap-2">
          <button (click)="salvarVinculos()"
            [style.background-color]="auth.corPrimaria()"
            class="flex-1 text-white py-2 rounded-lg text-sm font-medium transition">
            Salvar Vínculos
          </button>
          <button (click)="fecharVinculo()"
            class="px-4 py-2 border rounded-lg text-sm transition"
            [class.border-slate-600]="auth.tema() === 'dark'"
            [class.text-white]="auth.tema() === 'dark'"
            [class.hover:bg-slate-700]="auth.tema() === 'dark'"
            [class.border-gray-300]="auth.tema() !== 'dark'"
            [class.hover:bg-gray-50]="auth.tema() !== 'dark'">
            Cancelar
          </button>
        </div>
      </div>
    </div>
    }
  `,
  standalone: false,
})
export class ProfissionaisComponent implements OnInit {
  profissionais: Profissional[] = [];
  mostrarForm = false;
  editandoId: string | null = null;
  formNome = '';
  formCelular = '';
  formEspecialidade = '';
  formRegistro = '';
  hoveredEditId: string | null = null;
  hoveredVinculoId: string | null = null;

  auth = inject(AuthService);

  // Vínculo state
  mostrarVinculo = false;
  vinculoProfId = '';
  vinculoProfNome = '';
  vinculoServicos: Servico[] = [];
  vinculoSelecionados: Record<string, boolean> = {};

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.api.getProfissionais().subscribe({
      next: (res) => {
        this.profissionais = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar profissionais:', err),
    });
  }

  nova() {
    this.editandoId = null;
    this.limparForm();
    this.mostrarForm = true;
  }

  editar(prof: Profissional) {
    this.editandoId = prof.id;
    this.formNome = prof.nome;
    this.formCelular = prof.telefoneCelular || '';
    this.formEspecialidade = prof.especialidade || '';
    this.formRegistro = prof.registroProfissional || '';
    this.mostrarForm = true;
  }

  excluir(prof: Profissional) {
    if (!confirm(`Tem certeza que deseja excluir ${prof.nome}?`)) return;
    this.api.deleteProfissional(prof.id).subscribe({
      next: () => {
        this.carregar();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao excluir profissional:', err),
    });
  }

  cancelarEdicao() {
    this.mostrarForm = false;
    this.editandoId = null;
    this.limparForm();
  }

  salvar() {
    const data = {
      nome: this.formNome,
      telefoneCelular: this.formCelular,
      especialidade: this.formEspecialidade,
      registroProfissional: this.formRegistro,
    };

    const obs = this.editandoId
      ? this.api.updateProfissional(this.editandoId, data)
      : this.api.createProfissional(data);

    obs.subscribe(() => {
      this.carregar();
      this.mostrarForm = false;
      this.editandoId = null;
      this.limparForm();
    });
  }

  private limparForm() {
    this.formNome = '';
    this.formCelular = '';
    this.formEspecialidade = '';
    this.formRegistro = '';
  }

  // --- Vínculo methods ---

  abrirVinculos(prof: Profissional) {
    this.vinculoProfId = prof.id;
    this.vinculoProfNome = prof.nome;
    this.vinculoSelecionados = {};
    this.mostrarVinculo = true;

    this.api.getServicos().subscribe({
      next: (servicos) => {
        this.vinculoServicos = servicos;
        this.api.getVinculos().subscribe({
          next: (vinculos) => {
            const profVinculos = vinculos.filter(v => v.profissionalId === this.vinculoProfId);
            for (const serv of servicos) {
              this.vinculoSelecionados[serv.id] = profVinculos.some(v => v.servicoId === serv.id);
            }
            this.cdr.detectChanges();
          },
        });
      },
    });
  }

  fecharVinculo() {
    this.mostrarVinculo = false;
    this.vinculoProfId = '';
    this.vinculoProfNome = '';
    this.vinculoServicos = [];
    this.vinculoSelecionados = {};
  }

  salvarVinculos() {
    const promises: any[] = [];

    // Get current vinculos for this professional
    this.api.getVinculos().subscribe({
      next: (vinculos) => {
        const atuais = vinculos.filter(v => v.profissionalId === this.vinculoProfId);

        const desvincular = atuais.filter(v => !this.vinculoSelecionados[v.servicoId]);
        const vincular = this.vinculoServicos
          .filter(s => this.vinculoSelecionados[s.id] && !atuais.some(v => v.servicoId === s.id))
          .map(s => ({ profissionalId: this.vinculoProfId, servicoId: s.id }));

        const ops: Promise<void>[] = [];

        for (const del of desvincular) {
          ops.push(new Promise(resolve => {
            this.api.desvincularServico({ profissionalId: del.profissionalId, servicoId: del.servicoId })
              .subscribe({ next: () => resolve(), error: () => resolve() });
          }));
        }

        for (const add of vincular) {
          ops.push(new Promise(resolve => {
            this.api.vincularServico(add)
              .subscribe({ next: () => resolve(), error: () => resolve() });
          }));
        }

        Promise.all(ops).then(() => {
          this.fecharVinculo();
          this.cdr.detectChanges();
        });
      },
    });
  }
}
