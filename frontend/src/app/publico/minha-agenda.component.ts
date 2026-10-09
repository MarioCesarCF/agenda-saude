import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { PacienteAuthService } from '../services/paciente-auth.service';
import type { Agendamento, ConfiguracaoResponse, HorariosDisponiveis } from '../models/models';

const STATUS_LABEL: Record<string, string> = {
  Agendado: 'Agendado',
  Confirmado: 'Confirmado',
  Concluido: 'Concluído',
  Cancelado: 'Cancelado',
  Atendido: 'Atendido',
  Faltou: 'Faltou',
  Remarcado: 'Remarcado',
};

@Component({
  selector: 'app-minha-agenda',
  template: `
    <div class="space-y-4" [class.dark]="config?.tema === 'dark'">

      <div class="rounded-xl shadow-sm border p-4 flex items-center justify-between"
        [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
        <div>
          <h2 class="font-bold text-lg" [style.color]="config?.tema === 'dark' ? '#f8fafc' : '#111827'">Minha Agenda</h2>
          <p class="text-xs" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">Olá, {{ pacienteAuth.nome() }}</p>
        </div>
        <div class="flex gap-2">
          <button (click)="agendarNovo()"
            class="px-3 py-2 text-white rounded-lg font-medium text-xs transition cursor-pointer"
            [style.background-color]="config?.corPrimaria ?? '#059669'">
            + Agendar
          </button>
          <button (click)="sair()"
            class="px-3 py-2 rounded-lg font-medium text-xs transition cursor-pointer"
            [style.background-color]="config?.tema === 'dark' ? '#334155' : '#f3f4f6'"
            [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">
            Sair
          </button>
        </div>
      </div>

      @if (carregando) {
      <p class="text-sm text-center py-8" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
        Carregando seus agendamentos…
      </p>
      } @else if (agendamentos.length === 0) {
      <div class="rounded-xl shadow-sm border p-8 text-center"
        [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
        <div class="text-4xl mb-3">📅</div>
        <p class="font-medium mb-1" [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#111827'">Nenhuma consulta por aqui</p>
        <p class="text-xs mb-4" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
          Você ainda não possui agendamentos neste consultório.
        </p>
        <button (click)="agendarNovo()"
          class="px-4 py-2 text-white rounded-lg font-medium text-xs transition cursor-pointer"
          [style.background-color]="config?.corPrimaria ?? '#059669'">
          Agendar agora
        </button>
      </div>
      } @else {
        @if (proximos.length > 0) {
        <div class="rounded-xl shadow-sm border p-4"
          [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
          [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
          <h3 class="font-semibold text-sm mb-3" [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#1f2937'">
            Próximas consultas
          </h3>
          <div class="space-y-3">
            @for (a of proximos; track a.id) {
            <div class="rounded-lg border p-3"
              [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-semibold text-sm" [style.color]="config?.tema === 'dark' ? '#f8fafc' : '#111827'">
                    {{ a.servicoNome }}
                  </p>
                  <p class="text-xs mt-0.5" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
                    {{ a.profissionalNome }}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <span class="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium"
                    [style.background-color]="statusCor(a.status) + '20'"
                    [style.color]="statusCor(a.status)">
                    {{ rotuloStatus(a.status) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center justify-between mt-3">
                <div class="text-xs" [style.color]="config?.tema === 'dark' ? '#cbd5e1' : '#374151'">
                  <div class="font-medium">{{ formatarData(a.dataHoraInicio) }}</div>
                  <div [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
                    {{ formatarHora(a.dataHoraInicio) }} – {{ formatarHora(a.dataHoraFim) }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="abrirReagendar(a)"
                    class="text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                    [style.background-color]="config?.tema === 'dark' ? '#334155' : '#eff6ff'"
                    [style.color]="config?.corPrimaria ?? '#059669'">
                    Reagendar
                  </button>
                  <button (click)="cancelar(a)" [disabled]="cancelandoId === a.id"
                    class="text-xs px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50 cursor-pointer"
                    [style.background-color]="config?.tema === 'dark' ? '#334155' : '#fef2f2'"
                    [style.color]="'#ef4444'">
                    {{ cancelandoId === a.id ? 'Cancelando…' : 'Cancelar' }}
                  </button>
                </div>
              </div>
            </div>
            }
          </div>
        </div>
        }

        @if (historico.length > 0) {
        <div class="rounded-xl shadow-sm border p-4"
          [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
          [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
          <h3 class="font-semibold text-sm mb-3" [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#1f2937'">
            Histórico
          </h3>
          <div class="space-y-3">
            @for (a of historico; track a.id) {
            <div class="rounded-lg border p-3"
              [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-semibold text-sm" [style.color]="config?.tema === 'dark' ? '#f8fafc' : '#111827'">
                    {{ a.servicoNome }}
                  </p>
                  <p class="text-xs mt-0.5" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
                    {{ a.profissionalNome }}
                  </p>
                </div>
                <span class="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                  [style.background-color]="statusCor(a.status) + '20'"
                  [style.color]="statusCor(a.status)">
                  {{ rotuloStatus(a.status) }}
                </span>
              </div>
              <p class="text-xs mt-2" [style.color]="config?.tema === 'dark' ? '#cbd5e1' : '#374151'">
                {{ formatarData(a.dataHoraInicio) }} · {{ formatarHora(a.dataHoraInicio) }}
              </p>
            </div>
            }
          </div>
        </div>
        }
      }

      @if (reagendando) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(0,0,0,0.5)">
        <div class="rounded-xl shadow-lg border w-full max-w-lg max-h-[90vh] overflow-y-auto p-5"
          [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
          [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 class="font-bold text-base" [style.color]="config?.tema === 'dark' ? '#f8fafc' : '#111827'">
                Reagendar {{ reagendando.servicoNome }}
              </h3>
              <p class="text-xs mt-0.5" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
                {{ reagendando.profissionalNome }} · atual: {{ formatarData(reagendando.dataHoraInicio) }} às {{ formatarHora(reagendando.dataHoraInicio) }}
              </p>
            </div>
            <button (click)="fecharReagendar()"
              class="text-lg leading-none px-2 cursor-pointer"
              [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">✕</button>
          </div>

          @if (carregandoHorarios) {
          <p class="text-sm text-center py-6" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
            Carregando horários…
          </p>
          } @else if (horariosDisponiveis.length === 0) {
          <p class="text-sm text-center py-6" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
            Nenhum horário disponível no momento.
          </p>
          } @else {
          <div class="flex gap-2 overflow-x-auto pb-2">
            @for (d of horariosDisponiveis; track d.data) {
            <button (click)="selecionarDia(d)"
              class="shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition cursor-pointer"
              [style.background-color]="diaSelecionado === d.data ? (config?.corPrimaria ?? '#059669') : (config?.tema === 'dark' ? '#0f172a' : '#f9fafb')"
              [style.color]="diaSelecionado === d.data ? '#fff' : (config?.tema === 'dark' ? '#cbd5e1' : '#374151')"
              [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
              {{ formatarDiaChip(d.data) }}
            </button>
            }
          </div>

          @if (diaSelecionado) {
          <div class="flex flex-wrap gap-2 mt-3">
            @for (h of horasDoDiaSelecionado; track h) {
            <button (click)="horaSelecionada = h"
              class="px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer"
              [style.background-color]="horaSelecionada === h ? (config?.corPrimaria ?? '#059669') : (config?.tema === 'dark' ? '#0f172a' : '#f9fafb')"
              [style.color]="horaSelecionada === h ? '#fff' : (config?.tema === 'dark' ? '#cbd5e1' : '#374151')"
              [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
              {{ formatarSlot(h) }}
            </button>
            }
          </div>
          }
          }

          <div class="flex justify-end gap-2 mt-5">
            <button (click)="fecharReagendar()"
              class="px-4 py-2 rounded-lg font-medium text-xs transition cursor-pointer"
              [style.background-color]="config?.tema === 'dark' ? '#334155' : '#f3f4f6'"
              [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">
              Voltar
            </button>
            <button (click)="confirmarReagendamento()" [disabled]="!podeConfirmarReagendamento"
              class="px-4 py-2 text-white rounded-lg font-medium text-xs transition disabled:opacity-50 cursor-pointer"
              [style.background-color]="config?.corPrimaria ?? '#059669'">
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
export class MinhaAgendaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  pacienteAuth = inject(PacienteAuthService);

  consultorioId = '';
  config: ConfiguracaoResponse | null = null;
  agendamentos: Agendamento[] = [];
  carregando = true;
  cancelandoId = '';

  reagendando: Agendamento | null = null;
  horariosDisponiveis: HorariosDisponiveis[] = [];
  carregandoHorarios = false;
  diaSelecionado = '';
  horaSelecionada = '';
  salvandoReagendamento = false;

  get horasDoDiaSelecionado(): string[] {
    return this.horariosDisponiveis.find((d) => d.data === this.diaSelecionado)?.horarios ?? [];
  }

  get podeConfirmarReagendamento(): boolean {
    return !!this.diaSelecionado && !!this.horaSelecionada && !this.salvandoReagendamento;
  }

  get proximos(): Agendamento[] {
    const agora = Date.now();
    return this.agendamentos.filter(
      (a) =>
        new Date(a.dataHoraInicio).getTime() >= agora &&
        (a.status === 'Agendado' || a.status === 'Confirmado'),
    );
  }

  get historico(): Agendamento[] {
    const agora = Date.now();
    return this.agendamentos.filter(
      (a) => new Date(a.dataHoraInicio).getTime() < agora || a.status !== 'Agendado' && a.status !== 'Confirmado',
    );
  }

  ngOnInit() {
    this.consultorioId = this.route.snapshot.params['consultorioId'];
    this.api.getConfiguracaoPublica(this.consultorioId).subscribe({
      next: (res) => {
        this.config = res;
      },
    });
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.api.getMeusAgendamentos().subscribe({
      next: (res) => {
        this.agendamentos = res;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregando = false;
      },
    });
  }

  cancelar(a: Agendamento) {
    if (!confirm(`Cancelar ${a.servicoNome} em ${this.formatarData(a.dataHoraInicio)}?`)) return;
    this.cancelandoId = a.id;
    this.api.cancelarMeuAgendamento(a.id).subscribe({
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

  agendarNovo() {
    this.router.navigate(['/p', this.consultorioId]);
  }

  abrirReagendar(a: Agendamento) {
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

  private carregarHorarios(a: Agendamento) {
    this.carregandoHorarios = true;
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + 1);
    const fim = new Date();
    fim.setDate(fim.getDate() + (this.config?.diasAgenda ?? 14));

    this.api
      .getHorariosDisponiveis(
        this.consultorioId,
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
      .reagendarMeuAgendamento(this.reagendando.id, this.montarDataHora(this.diaSelecionado, this.horaSelecionada))
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

  sair() {
    this.pacienteAuth.logout();
    this.router.navigate(['/p', this.consultorioId]);
  }

  rotuloStatus(status: string): string {
    return STATUS_LABEL[status] ?? status;
  }

  statusCor(status: string): string {
    switch (status) {
      case 'Cancelado':
      case 'Faltou':
        return '#ef4444';
      case 'Concluido':
      case 'Atendido':
        return '#10b981';
      case 'Confirmado':
        return this.config?.corDestaque ?? '#f59e0b';
      default:
        return this.config?.corPrimaria ?? '#059669';
    }
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
}