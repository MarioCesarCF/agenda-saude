import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import type { Profissional, Servico, HorarioDisponivel } from '../models/models';

@Component({
  selector: 'app-horarios',
  template: `
    <div class="max-w-5xl mx-auto">
      <h1 class="text-2xl font-bold mb-6" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">Horários de Atendimento</h1>

      <div class="flex gap-1 mb-6 border-b"
        [style.border-color]="auth.tema() === 'dark' ? '#334155' : '#e5e7eb'">
        <button (click)="abaAtiva = 'profissionais'" class="px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px"
          [style.border-color]="abaAtiva === 'profissionais' ? auth.corPrimaria() : 'transparent'"
          [style.color]="abaAtiva === 'profissionais' ? auth.corPrimaria() : (auth.tema() === 'dark' ? '#94a3b8' : '#6b7280')">
          Horário dos Profissionais
        </button>
        <button (click)="abaAtiva = 'servicos'" class="px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px"
          [style.border-color]="abaAtiva === 'servicos' ? auth.corPrimaria() : 'transparent'"
          [style.color]="abaAtiva === 'servicos' ? auth.corPrimaria() : (auth.tema() === 'dark' ? '#94a3b8' : '#6b7280')">
          Horário dos Serviços
        </button>
      </div>

      @if (mostrarForm) {
      <div class="bg-white rounded-xl shadow-sm border p-4 mb-6"
        [class.bg-slate-800]="auth.tema() === 'dark'"
        [class.border-slate-700]="auth.tema() === 'dark'">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#374151'">
            {{ abaAtiva === 'servicos' ? 'Novo Horário de Serviço' : 'Novo Horário de Profissional' }}
          </h2>
          <button type="button" (click)="cancelarEdicao()" class="text-gray-400 hover:text-gray-600 text-sm">&#10005;</button>
        </div>
        <form (ngSubmit)="salvar()" class="flex flex-wrap items-end gap-3">
          @if (abaAtiva === 'profissionais') {
          <div class="flex-1 min-w-[180px]">
            <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Profissional</label>
            <select [(ngModel)]="formProfissionalId" name="profissional" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="auth.tema() === 'dark'"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [class.text-white]="auth.tema() === 'dark'">
              <option value="">Selecione...</option>
              @for (p of profissionais; track p.id) {
              <option [value]="p.id">{{ p.nome }}</option>
              }
            </select>
          </div>
          } @else {
          <div class="flex-1 min-w-[180px]">
            <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Servico</label>
            <select [(ngModel)]="formServicoId" name="servico" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="auth.tema() === 'dark'"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [class.text-white]="auth.tema() === 'dark'">
              <option value="">Selecione...</option>
              @for (s of servicosSemProfissional; track s.id) {
              <option [value]="s.id">{{ s.nome }}</option>
              }
            </select>
          </div>
          }
          <div class="min-w-[130px]">
            <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Dia da Semana</label>
            <select [(ngModel)]="formDiaSemana" name="dia" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="auth.tema() === 'dark'"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [class.text-white]="auth.tema() === 'dark'">
              @for (d of diasSemana; track d.valor) {
              <option [value]="d.valor">{{ d.label }}</option>
              }
            </select>
          </div>
          <div class="min-w-[100px]">
            <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Inicio</label>
            <input type="time" [(ngModel)]="formHoraInicio" name="inicio" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="auth.tema() === 'dark'"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [class.text-white]="auth.tema() === 'dark'">
          </div>
          <div class="min-w-[100px]">
            <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Fim</label>
            <input type="time" [(ngModel)]="formHoraFim" name="fim" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="auth.tema() === 'dark'"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [class.text-white]="auth.tema() === 'dark'">
          </div>
          <button type="submit" [style.background-color]="auth.corPrimaria()"
            class="px-4 py-2 text-white rounded-lg text-sm transition"
            (mouseenter)="$any($event.target).style.filter='brightness(0.85)'"
            (mouseleave)="$any($event.target).style.filter='none'">
            Salvar
          </button>
        </form>
        @if (mensagem) {
        <p class="text-sm mt-2" [class.text-red-500]="mensagem.includes('Erro')" [class.text-emerald-600]="!mensagem.includes('Erro')">{{ mensagem }}</p>
        }
      </div>
      }

      @if (abaAtiva === 'profissionais') {
        <div class="flex items-center justify-end mb-4">
          <button (click)="nova()" [style.background-color]="auth.corPrimaria()"
            class="px-3 py-1.5 text-white rounded-lg text-sm transition"
            (mouseenter)="$any($event.target).style.filter='brightness(0.85)'"
            (mouseleave)="$any($event.target).style.filter='none'">
            + Novo Horario
          </button>
        </div>
        <div class="space-y-4">
          @for (prof of profissionais; track prof.id) {
          <div class="bg-white rounded-xl shadow-sm border overflow-hidden"
            [class.bg-slate-800]="auth.tema() === 'dark'"
            [class.border-slate-700]="auth.tema() === 'dark'">
            <div class="px-4 py-3 border-b flex items-center gap-3"
              [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
              [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#f9fafb'">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                [style.background-color]="auth.corPrimaria()">
                {{ prof.nome.charAt(0) }}
              </div>
              <span class="font-medium text-sm" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">{{ prof.nome }}</span>
              @if (prof.especialidade) {
              <span class="text-xs" [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">{{ prof.especialidade }}</span>
              }
            </div>
            <div class="p-3">
              @if (getHorariosProf(prof.id).length === 0) {
              <p class="text-xs py-2" [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">Nenhum horario configurado</p>
              } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                @for (h of getHorariosProf(prof.id); track h.id) {
                <div class="flex items-center justify-between px-3 py-2 rounded-lg border text-xs"
                  [style.border-color]="auth.tema() === 'dark' ? '#334155' : '#e5e7eb'"
                  [style.background-color]="auth.tema() === 'dark' ? '#111827' : '#fff'">
                  <span [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">
                    {{ diasSemanaLabels[h.diaSemana] }} {{ h.horaInicio }} - {{ h.horaFim }}
                  </span>
                  <button (click)="excluir(h)" title="Excluir"
                    class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    </svg>
                  </button>
                </div>
                }
              </div>
              }
            </div>
          </div>
          } @empty {
          <div class="text-center py-8" [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">
            Nenhum profissional cadastrado
          </div>
          }
        </div>
      } @else {
        <div class="flex items-center justify-end mb-4">
          <button (click)="nova()" [style.background-color]="auth.corSecundaria()"
            class="px-3 py-1.5 text-white rounded-lg text-sm transition"
            (mouseenter)="$any($event.target).style.filter='brightness(0.85)'"
            (mouseleave)="$any($event.target).style.filter='none'">
            + Novo Horario
          </button>
        </div>
        @if (servicosSemProfissional.length === 0) {
        <div class="text-center py-12 rounded-xl border"
          [style.border-color]="auth.tema() === 'dark' ? '#334155' : '#e5e7eb'"
          [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#fff'">
          <p class="text-sm" [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">
            Nenhum servico sem profissional encontrado.
          </p>
          <p class="text-xs mt-1" [style.color]="auth.tema() === 'dark' ? '#475569' : '#9ca3af'">
            Crie servicos com a opcao "Sem profissional especifico" em Servicos.
          </p>
        </div>
        } @else {
        <div class="space-y-4">
          @for (serv of servicosSemProfissional; track serv.id) {
          <div class="bg-white rounded-xl shadow-sm border overflow-hidden"
            [class.bg-slate-800]="auth.tema() === 'dark'"
            [class.border-slate-700]="auth.tema() === 'dark'">
            <div class="px-4 py-3 border-b flex items-center gap-3"
              [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
              [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#f9fafb'">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                [style.background-color]="auth.corSecundaria()">
                {{ serv.nome.charAt(0) }}
              </div>
              <span class="font-medium text-sm" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">{{ serv.nome }}</span>
              <span class="text-xs" [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">{{ serv.duracaoMinutos }}min</span>
            </div>
            <div class="p-3">
              @if (getHorariosServico(serv.id).length === 0) {
              <p class="text-xs py-2" [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">Nenhum horario configurado</p>
              } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                @for (h of getHorariosServico(serv.id); track h.id) {
                <div class="flex items-center justify-between px-3 py-2 rounded-lg border text-xs"
                  [style.border-color]="auth.tema() === 'dark' ? '#334155' : '#e5e7eb'"
                  [style.background-color]="auth.tema() === 'dark' ? '#111827' : '#fff'">
                  <span [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">
                    {{ diasSemanaLabels[h.diaSemana] }} {{ h.horaInicio }} - {{ h.horaFim }}
                  </span>
                  <button (click)="excluir(h)" title="Excluir"
                    class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    </svg>
                  </button>
                </div>
                }
              </div>
              }
            </div>
          </div>
          }
        </div>
        }
      }
    </div>
  `,
  standalone: false,
})
export class HorariosComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  auth = inject(AuthService);

  profissionais: Profissional[] = [];
  servicos: Servico[] = [];
  horarios: HorarioDisponivel[] = [];
  mostrarForm = false;
  mensagem = '';
  abaAtiva: 'profissionais' | 'servicos' = 'profissionais';

  formProfissionalId = '';
  formServicoId = '';
  formDiaSemana = '1';
  formHoraInicio = '08:00';
  formHoraFim = '12:00';

  diasSemana = [
    { valor: '0', label: 'Domingo' },
    { valor: '1', label: 'Segunda' },
    { valor: '2', label: 'Terca' },
    { valor: '3', label: 'Quarta' },
    { valor: '4', label: 'Quinta' },
    { valor: '5', label: 'Sexta' },
    { valor: '6', label: 'Sabado' },
  ];

  diasSemanaLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  get servicosSemProfissional(): Servico[] {
    return this.servicos.filter(s => s.semProfissional);
  }

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.api.getProfissionais().subscribe({
      next: (res) => { this.profissionais = res; this.cdr.detectChanges(); },
    });
    this.api.getServicos().subscribe({
      next: (res) => { this.servicos = res; this.cdr.detectChanges(); },
    });
    this.api.getHorarios().subscribe({
      next: (res) => { this.horarios = res; this.cdr.detectChanges(); },
    });
  }

  getHorariosProf(profId: string): HorarioDisponivel[] {
    return this.horarios
      .filter(h => h.profissionalId === profId)
      .sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio));
  }

  getHorariosServico(servId: string): HorarioDisponivel[] {
    return this.horarios
      .filter(h => h.servicoId === servId)
      .sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio));
  }

  nova() {
    this.mensagem = '';
    this.formProfissionalId = '';
    this.formServicoId = '';
    this.formDiaSemana = '1';
    this.formHoraInicio = '08:00';
    this.formHoraFim = '12:00';
    this.mostrarForm = true;
  }

  cancelarEdicao() {
    this.mostrarForm = false;
    this.mensagem = '';
  }

  salvar() {
    if (this.abaAtiva === 'profissionais') {
      if (!this.formProfissionalId) {
        this.mensagem = 'Erro: selecione um profissional.';
        return;
      }
      this.api.createHorario({
        profissionalId: this.formProfissionalId,
        diaSemana: parseInt(this.formDiaSemana),
        horaInicio: this.formHoraInicio,
        horaFim: this.formHoraFim,
      }).subscribe({
        next: () => { this.mostrarForm = false; this.mensagem = ''; this.carregar(); },
        error: () => { this.mensagem = 'Erro ao salvar horario.'; this.cdr.detectChanges(); },
      });
    } else {
      if (!this.formServicoId) {
        this.mensagem = 'Erro: selecione um servico.';
        return;
      }
      this.api.createHorario({
        servicoId: this.formServicoId,
        diaSemana: parseInt(this.formDiaSemana),
        horaInicio: this.formHoraInicio,
        horaFim: this.formHoraFim,
      }).subscribe({
        next: () => { this.mostrarForm = false; this.mensagem = ''; this.carregar(); },
        error: () => { this.mensagem = 'Erro ao salvar horario.'; this.cdr.detectChanges(); },
      });
    }
  }

  excluir(h: HorarioDisponivel) {
    const dono = h.profissionalNome ?? h.servicoNome ?? 'Clínica';
    if (!confirm(`Excluir horario ${this.diasSemanaLabels[h.diaSemana]} ${h.horaInicio}-${h.horaFim} de ${dono}?`)) return;
    this.api.deleteHorario(h.id).subscribe({
      next: () => this.carregar(),
    });
  }
}
