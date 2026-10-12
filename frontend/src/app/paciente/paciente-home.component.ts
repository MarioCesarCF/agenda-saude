import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ContaPacienteAuthService } from '../services/conta-paciente-auth.service';
import type { AgendamentoConta, HorariosDisponiveis } from '../models/models';

const STATUS_LABEL: Record<string, string> = {
  Agendado: 'Agendado',
  Confirmado: 'Confirmado',
  Concluido: 'Concluído',
  Cancelado: 'Cancelado',
  Atendido: 'Atendido',
  Faltou: 'Faltou',
  Remarcado: 'Remarcado',
};

interface GrupoConsulta {
  consultorioId: string;
  consultorioSlug: string;
  consultorioNome: string;
  corPrimaria: string;
  corDestaque: string;
  proximos: AgendamentoConta[];
  historico: AgendamentoConta[];
}

@Component({
  selector: 'app-paciente-home',
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🗓️</span>
            <div>
              <div class="font-bold text-slate-900 leading-tight">Minha Agenda</div>
              <div class="text-xs text-slate-500">Olá, {{ contaPacienteAuth.nome() }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="sair()"
              class="px-3 py-2 rounded-lg font-medium text-xs transition cursor-pointer bg-slate-100 text-slate-700">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-6 space-y-6">
        @if (carregando) {
        <p class="text-sm text-center py-10 text-slate-500">Carregando seus agendamentos…</p>
        } @else if (agendamentos.length === 0) {
        <div class="rounded-xl shadow-sm border border-slate-200 bg-white p-8 text-center">
          <div class="text-4xl mb-3">📅</div>
          <p class="font-medium mb-1 text-slate-900">Nenhuma consulta encontrada</p>
          <p class="text-xs mb-4 text-slate-500">
            Os agendamentos de todos os consultórios onde você se cadastrou aparecerão aqui.
          </p>
        </div>
        } @else {

        @for (grupo of grupos; track grupo.consultorioId) {
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-sm text-slate-800 inline-flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full"
                [style.background-color]="grupo.corPrimaria"></span>
              {{ grupo.consultorioNome }}
            </h2>
            <a (click)="verClinica(grupo)"
              class="text-xs font-medium underline cursor-pointer"
              [style.color]="grupo.corPrimaria">
              Agendar neste consultório →
            </a>
          </div>

          @if (grupo.proximos.length === 0 && grupo.historico.length === 0) {
          <div class="rounded-xl border border-slate-200 bg-white p-5 text-center">
            <p class="text-xs text-slate-500">Nenhum agendamento neste consultório.</p>
          </div>
          }

          @if (grupo.proximos.length > 0) {
          <div class="rounded-xl shadow-sm border border-slate-200 bg-white p-4 mb-3">
            <h3 class="font-semibold text-xs uppercase tracking-wide text-slate-500 mb-3">Próximas consultas</h3>
            <div class="space-y-3">
              @for (a of grupo.proximos; track a.id) {
              <div class="rounded-lg border border-slate-200 p-3">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="font-semibold text-sm text-slate-900">{{ a.servicoNome }}</p>
                    <p class="text-xs mt-0.5 text-slate-500">{{ a.profissionalNome }}</p>
                  </div>
                  <span class="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                    [style.background-color]="statusCor(grupo, a.status) + '20'"
                    [style.color]="statusCor(grupo, a.status)">
                    {{ rotuloStatus(a.status) }}
                  </span>
                </div>
                <div class="flex items-center justify-between mt-3">
                  <div class="text-xs text-slate-700">
                    <div class="font-medium">{{ formatarData(a.dataHoraInicio) }}</div>
                    <div class="text-slate-500">
                      {{ formatarHora(a.dataHoraInicio) }} – {{ formatarHora(a.dataHoraFim) }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="abrirReagendar(a)"
                      class="text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                      [style.background-color]="corPrimaria(a) + '1a'"
                      [style.color]="corPrimaria(a)">
                      Reagendar
                    </button>
                    <button (click)="cancelar(a)" [disabled]="cancelandoId === a.id"
                      class="text-xs px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50 cursor-pointer bg-red-50 text-red-500">
                      {{ cancelandoId === a.id ? 'Cancelando…' : 'Cancelar' }}
                    </button>
                  </div>
                </div>
              </div>
              }
            </div>
          </div>
          }

          @if (grupo.historico.length > 0) {
          <div class="rounded-xl shadow-sm border border-slate-200 bg-white p-4">
            <h3 class="font-semibold text-xs uppercase tracking-wide text-slate-500 mb-3">Histórico</h3>
            <div class="space-y-2">
              @for (a of grupo.historico; track a.id) {
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="font-medium text-sm text-slate-800">{{ a.servicoNome }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ formatarData(a.dataHoraInicio) }} · {{ formatarHora(a.dataHoraInicio) }}
                  </p>
                </div>
                <span class="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                  [style.background-color]="statusCor(grupo, a.status) + '20'"
                  [style.color]="statusCor(grupo, a.status)">
                  {{ rotuloStatus(a.status) }}
                </span>
              </div>
              }
            </div>
          </div>
          }
        </section>
        }
        }
      </main>

      @if (reagendando) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.5)">
        <div class="rounded-xl shadow-lg border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 bg-white">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 class="font-bold text-base text-slate-900">Reagendar {{ reagendando.servicoNome }}</h3>
              <p class="text-xs mt-0.5 text-slate-500">
                {{ reagendando.profissionalNome }} · {{ reagendando.consultorioNome }} · atual:
                {{ formatarData(reagendando.dataHoraInicio) }} às {{ formatarHora(reagendando.dataHoraInicio) }}
              </p>
            </div>
            <button (click)="fecharReagendar()" class="text-lg leading-none px-2 cursor-pointer text-slate-500">✕</button>
          </div>

          @if (carregandoHorarios) {
          <p class="text-sm text-center py-6 text-slate-500">Carregando horários…</p>
          } @else if (horariosDisponiveis.length === 0) {
          <p class="text-sm text-center py-6 text-slate-500">Nenhum horário disponível no momento.</p>
          } @else {
          <div class="flex gap-2 overflow-x-auto pb-2">
            @for (d of horariosDisponiveis; track d.data) {
            <button (click)="selecionarDia(d)"
              class="shrink-0 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 transition cursor-pointer"
              [style.background-color]="diaSelecionado === d.data ? corPrimaria(reagendando) : '#f9fafb'"
              [style.color]="diaSelecionado === d.data ? '#fff' : '#374151'">
              {{ formatarDiaChip(d.data) }}
            </button>
            }
          </div>

          @if (diaSelecionado) {
          <div class="flex flex-wrap gap-2 mt-3">
            @for (h of horasDoDiaSelecionado; track h) {
            <button (click)="horaSelecionada = h"
              class="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition cursor-pointer"
              [style.background-color]="horaSelecionada === h ? corPrimaria(reagendando) : '#f9fafb'"
              [style.color]="horaSelecionada === h ? '#fff' : '#374151'">
              {{ formatarSlot(h) }}
            </button>
            }
          </div>
          }
          }

          <div class="flex justify-end gap-2 mt-5">
            <button (click)="fecharReagendar()"
              class="px-4 py-2 rounded-lg font-medium text-xs transition cursor-pointer bg-slate-100 text-slate-700">
              Voltar
            </button>
            <button (click)="confirmarReagendamento()" [disabled]="!podeConfirmarReagendamento"
              class="px-4 py-2 rounded-lg font-medium text-xs transition disabled:opacity-50 text-white cursor-pointer"
              [style.background-color]="reagendando ? corPrimaria(reagendando) : '#059669'">
              {{ salvandoReagendamento ? 'Salvando…' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  standalone: false,
})
export class PacienteHomeComponent implements OnInit {
  private router = inject(Router);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  contaPacienteAuth = inject(ContaPacienteAuthService);

  agendamentos: AgendamentoConta[] = [];
  carregando = true;
  cancelandoId = '';

  reagendando: AgendamentoConta | null = null;
  horariosDisponiveis: HorariosDisponiveis[] = [];
  carregandoHorarios = false;
  diaSelecionado = '';
  horaSelecionada = '';
  salvandoReagendamento = false;

  get grupos(): GrupoConsulta[] {
    const agora = Date.now();
    const map = new Map<string, GrupoConsulta>();

    for (const a of this.agendamentos) {
      const chave = a.consultorioId;
      if (!map.has(chave)) {
        map.set(chave, {
          consultorioId: chave,
          consultorioSlug: a.consultorioSlug || chave,
          consultorioNome: a.consultorioNome,
          corPrimaria: a.consultorioCorPrimaria || '#059669',
          corDestaque: a.consultorioCorDestaque || '#f59e0b',
          proximos: [],
          historico: [],
        });
      }
      const grupo = map.get(chave)!;
      const futuro = new Date(a.dataHoraInicio).getTime() >= agora;
      const ativo = a.status === 'Agendado' || a.status === 'Confirmado';
      if (futuro && ativo) grupo.proximos.push(a);
      else grupo.historico.push(a);
    }

    return [...map.values()];
  }

  get horasDoDiaSelecionado(): string[] {
    return this.horariosDisponiveis.find((d) => d.data === this.diaSelecionado)?.horarios ?? [];
  }

  get podeConfirmarReagendamento(): boolean {
    return !!this.diaSelecionado && !!this.horaSelecionada && !this.salvandoReagendamento;
  }

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.api.getMeusAgendamentosConta().subscribe({
      next: (res) => {
        this.agendamentos = res ?? [];
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.agendamentos = [];
        this.carregando = false;
        this.cdr.detectChanges();
      },
    });
  }

  cancelar(a: AgendamentoConta) {
    if (!confirm(`Cancelar ${a.servicoNome} em ${this.formatarData(a.dataHoraInicio)}?`)) return;
    this.cancelandoId = a.id;
    this.api.cancelarMeuAgendamentoConta(a.id).subscribe({
      next: () => {
        this.cancelandoId = '';
        this.carregar();
      },
      error: () => {
        this.cancelandoId = '';
        alert('Não foi possível cancelar. Tente novamente.');
      },
    });
  }

  abrirReagendar(a: AgendamentoConta) {
    this.reagendando = a;
    this.horariosDisponiveis = [];
    this.diaSelecionado = '';
    this.horaSelecionada = '';
    this.carregarHorarios(a);
  }

  fecharReagendar() {
    this.reagendando = null;
    this.horariosDisponiveis = [];
    this.carregandoHorarios = false;
  }

  private carregarHorarios(a: AgendamentoConta) {
    this.carregandoHorarios = true;
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + 1);
    const fim = new Date();
    fim.setDate(fim.getDate() + 30);

    this.api
      .getHorariosDisponiveis(
        a.consultorioSlug || a.consultorioId,
        a.profissionalId || undefined,
        a.servicoId,
        this.paraISOData(inicio),
        this.paraISOData(fim),
      )
      .subscribe({
        next: (res) => {
          this.horariosDisponiveis = (res ?? []).filter((d) => (d.horarios?.length ?? 0) > 0);
          this.carregandoHorarios = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.horariosDisponiveis = [];
          this.carregandoHorarios = false;
          this.cdr.detectChanges();
        },
      });
  }

  selecionarDia(d: HorariosDisponiveis) {
    this.diaSelecionado = d.data;
    this.horaSelecionada = '';
  }

  confirmarReagendamento() {
    if (!this.reagendando || !this.podeConfirmarReagendamento) return;
    this.salvandoReagendamento = true;
    this.api
      .reagendarMeuAgendamentoConta(this.reagendando.id, this.montarDataHora(this.diaSelecionado, this.horaSelecionada))
      .subscribe({
        next: () => {
          this.salvandoReagendamento = false;
          this.reagendando = null;
          this.carregar();
        },
        error: () => {
          this.salvandoReagendamento = false;
          alert('Não foi possível reagendar. O horário pode ter sido ocupado.');
        },
      });
  }

  verClinica(grupo: GrupoConsulta) {
    this.router.navigate(['/p', grupo.consultorioSlug]);
  }

  sair() {
    this.contaPacienteAuth.logout();
    this.router.navigate(['/paciente', 'entrar']);
  }

  corPrimaria(a: AgendamentoConta): string {
    return a.consultorioCorPrimaria || '#059669';
  }

  rotuloStatus(status: string): string {
    return STATUS_LABEL[status] ?? status;
  }

  statusCor(grupo: GrupoConsulta, status: string): string {
    switch (status) {
      case 'Cancelado':
      case 'Faltou':
        return '#ef4444';
      case 'Concluido':
      case 'Atendido':
        return '#10b981';
      case 'Confirmado':
        return grupo.corDestaque;
      default:
        return grupo.corPrimaria;
    }
  }

  formatarDiaChip(dataISO: string): string {
    return new Date(dataISO).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  }

  formatarSlot(hora: string): string {
    return hora.substring(0, 5);
  }

  formatarData(dataISO: string): string {
    return new Date(dataISO).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatarHora(dataISO: string): string {
    return new Date(dataISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private paraISOData(d: Date): string {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private montarDataHora(diaData: string, hora: string): string {
    const isoData = diaData.substring(0, 10);
    return `${isoData}T${hora.substring(0, 5)}:00`;
  }
}