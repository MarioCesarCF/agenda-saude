import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import type { Servico } from '../models/models';

@Component({
  selector: 'app-servicos',
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">Serviços</h1>
        <button
          (click)="nova()"
          [style.background-color]="auth.corPrimaria()"
          class="px-4 py-2 text-white rounded-lg text-sm transition"
          (mouseenter)="$any($event.target).style.filter='brightness(0.85)'"
          (mouseleave)="$any($event.target).style.filter='none'"
        >
          + Novo Serviço
        </button>
      </div>

      @if (mostrarForm) {
      <div class="rounded-xl shadow-sm border p-4 mb-6"
        [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="auth.tema() === 'dark' ? '#334155' : '#e5e7eb'">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#374151'">{{ editandoId ? 'Editar' : 'Novo' }} Serviço</h2>
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
                class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                [class.bg-slate-700]="auth.tema() === 'dark'"
                [class.border-slate-600]="auth.tema() === 'dark'"
                [class.text-white]="auth.tema() === 'dark'"
                [style.--tw-ring-color]="auth.corSecundaria()"
                [class.focus]="true"
                style="--tw-ring-opacity:1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                [(ngModel)]="formPreco"
                name="preco"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                [class.bg-slate-700]="auth.tema() === 'dark'"
                [class.border-slate-600]="auth.tema() === 'dark'"
                [class.text-white]="auth.tema() === 'dark'"
                [style.--tw-ring-color]="auth.corSecundaria()"
                style="--tw-ring-opacity:1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1"
                [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Duração (min)</label>
              <input
                type="number"
                [(ngModel)]="formDuracao"
                name="duracao"
                required
                class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                [class.bg-slate-700]="auth.tema() === 'dark'"
                [class.border-slate-600]="auth.tema() === 'dark'"
                [class.text-white]="auth.tema() === 'dark'"
                [style.--tw-ring-color]="auth.corSecundaria()"
                style="--tw-ring-opacity:1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Cor</label>
              <input
                type="color"
                [(ngModel)]="formCor"
                name="cor"
                class="w-full h-9 px-1 border rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="semProfissional" [(ngModel)]="formSemProfissional" name="semProfissional"
              class="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500">
            <label for="semProfissional" class="text-sm" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">
              Serviço não requer profissional específico
              <span class="text-xs ml-1" [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">(ex: exames, raio-x)</span>
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Descrição</label>
            <textarea
              [(ngModel)]="formDescricao"
              name="descricao"
              rows="2"
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="auth.tema() === 'dark'"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [class.text-white]="auth.tema() === 'dark'"
              [style.--tw-ring-color]="auth.corSecundaria()"
              style="--tw-ring-opacity:1"
            ></textarea>
          </div>
          <div class="flex gap-2">
            <button
              type="submit"
              [style.background-color]="auth.corPrimaria()"
              class="px-4 py-2 text-white rounded-lg text-sm transition"
              (mouseenter)="$any($event.target).style.filter='brightness(0.85)'"
              (mouseleave)="$any($event.target).style.filter='none'"
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

      <div class="grid grid-cols-3 gap-4">
        @for (serv of servicos; track serv.id) {
        <div class="rounded-xl shadow-sm border p-4 flex flex-col"
          [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#fff'"
          [style.border-color]="auth.tema() === 'dark' ? '#334155' : '#e5e7eb'">
          <div
            class="w-full h-2 rounded-full mb-3"
            [style.background-color]="serv.cor || '#10b981'"
          ></div>
          <h3 class="font-medium" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">{{ serv.nome }}</h3>
          @if (serv.semProfissional) {
          <span class="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1"
            [style.background-color]="auth.tema() === 'dark' ? '#064e3b' : '#ecfdf5'"
            [style.color]="auth.tema() === 'dark' ? '#6ee7b7' : '#047857'">Sem profissional</span>
          }
          @if (serv.descricao) {
          <p class="text-sm mt-1 flex-1" [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">{{ serv.descricao }}</p>
          }
          <div class="flex items-center justify-between mt-3 text-sm">
            <div>
              <span [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">{{ serv.duracaoMinutos }} min</span>
              <span class="font-semibold ml-2" [style.color]="auth.corDestaque()"
                >R$ {{ serv.preco.toFixed(2) }}</span
              >
            </div>
            <div class="flex gap-1">
              <button
                type="button"
                (click)="editar(serv)"
                title="Editar serviço"
                class="p-1.5 text-gray-400 rounded-lg transition"
                [style.--h-color]="auth.corDestaque()"
                (mouseenter)="$any($event.target).style.color=auth.corDestaque(); $any($event.target).style.background=auth.corDestaque()+'20'"
                (mouseleave)="$any($event.target).style.color='#9ca3af'; $any($event.target).style.background='transparent'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="m15 5 4 4"/>
                </svg>
              </button>
              <button
                type="button"
                (click)="excluir(serv)"
                title="Excluir serviço"
                class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" x2="10" y1="11" y2="17"/>
                  <line x1="14" x2="14" y1="11" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        } @empty {
        <div class="col-span-3 text-center py-8" [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">
          Nenhum serviço cadastrado
        </div>
        }
      </div>
    </div>
  `,
  standalone: false,
})
export class ServicosComponent implements OnInit {
  auth = inject(AuthService);
  servicos: Servico[] = [];
  mostrarForm = false;
  editandoId: string | null = null;
  formNome = '';
  formPreco = 0;
  formDuracao = 30;
  formDescricao = '';
  formCor = '#10b981';
  formSemProfissional = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.api.getServicos().subscribe({
      next: (res) => {
        this.servicos = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar serviços:', err),
    });
  }

  nova() {
    this.editandoId = null;
    this.limparForm();
    this.mostrarForm = true;
  }

  editar(serv: Servico) {
    this.editandoId = serv.id;
    this.formNome = serv.nome;
    this.formPreco = serv.preco;
    this.formDuracao = serv.duracaoMinutos;
    this.formDescricao = serv.descricao || '';
    this.formCor = serv.cor || '#10b981';
    this.formSemProfissional = serv.semProfissional;
    this.mostrarForm = true;
  }

  excluir(serv: Servico) {
    if (!confirm(`Tem certeza que deseja excluir ${serv.nome}?`)) return;
    this.api.deleteServico(serv.id).subscribe({
      next: () => {
        this.carregar();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao excluir serviço:', err),
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
      preco: this.formPreco,
      duracaoMinutos: this.formDuracao,
      descricao: this.formDescricao,
      cor: this.formCor,
      semProfissional: this.formSemProfissional,
    };

    const obs = this.editandoId
      ? this.api.updateServico(this.editandoId, data)
      : this.api.createServico(data);

    obs.subscribe(() => {
      this.carregar();
      this.mostrarForm = false;
      this.editandoId = null;
      this.limparForm();
    });
  }

  private limparForm() {
    this.formNome = '';
    this.formPreco = 0;
    this.formDuracao = 30;
    this.formDescricao = '';
    this.formCor = '#10b981';
    this.formSemProfissional = false;
  }
}
