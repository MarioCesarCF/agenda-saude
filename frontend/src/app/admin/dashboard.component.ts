import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import type { Agendamento, HorariosDisponiveis } from '../models/models';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold" [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#1f2937'">Agenda</h1>
        <div class="flex items-center gap-2">
          <button (click)="mesAnterior()"
            class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
            [style.color]="auth.tema() === 'dark' ? '#d1d5db' : '#374151'">‹</button>
          <span class="font-medium text-sm min-w-[160px] text-center capitalize"
            [style.color]="auth.tema() === 'dark' ? '#e5e7eb' : '#374151'">
            {{ mesAtual | date:"MMMM 'de' yyyy" }}
          </span>
          <button (click)="proximoMes()"
            class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
            [style.color]="auth.tema() === 'dark' ? '#d1d5db' : '#374151'">›</button>
          <button (click)="hoje()"
            class="px-3 py-1.5 text-sm text-white rounded-lg"
            [style.background-color]="auth.corPrimaria()"
            (mouseenter)="$any($event.target).style.filter = 'brightness(0.9)'"
            (mouseleave)="$any($event.target).style.filter = ''">Hoje</button>
        </div>
      </div>

      <div class="rounded-xl shadow-sm border" [style.background-color]="auth.tema() === 'dark' ? '#111827' : '#ffffff'">
        <!-- Calendar -->
        <div class="p-4 border-b" [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'">
          <div class="grid grid-cols-7 gap-1 mb-1">
            @for (d of diasSemanaMes; track d) {
            <div class="text-center text-[10px] font-medium py-1"
              [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">{{ d }}</div>
            }
          </div>
          <div class="grid grid-cols-7 gap-1">
            @for (dia of calendarioMes; track $index) {
            <button (click)="ehMesAtual(dia) && selecionarDia(dia)"
              class="relative py-2 text-xs rounded-lg border transition text-center"
              [class.opacity-20]="!ehMesAtual(dia)"
              [class.pointer-events-none]="!ehMesAtual(dia)"
              [style.borderColor]="isMesmoDia(dia, dataSelecionada) ? auth.corDestaque() : 'transparent'"
              [style.backgroundColor]="isMesmoDia(dia, dataSelecionada) ? rgbaDestaque(0.1) : (isMesmoDia(dia, dataHoje) ? rgbaDestaque(0.05) : 'transparent')"
              [style.color]="isMesmoDia(dia, dataSelecionada) ? auth.corDestaque() : (auth.tema() === 'dark' ? '#d1d5db' : '#374151')"
              [class.font-semibold]="isMesmoDia(dia, dataSelecionada)">
              <div>{{ dia.getDate() }}</div>
              @if (ehMesAtual(dia) && temAgendamentos(dia)) {
              <div class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                [style.background-color]="auth.corDestaque()"></div>
              }
            </button>
            }
          </div>
        </div>

        <!-- Appointments list -->
        <div class="p-4 space-y-2">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium" [style.color]="auth.tema() === 'dark' ? '#e5e7eb' : '#374151'">
              {{ dataSelecionada | date:"EEEE, dd 'de' MMMM" }}
            </p>
            <span class="text-xs" [style.color]="auth.tema() === 'dark' ? '#6b7280' : '#9ca3af'">
              {{ agendamentos.length }} agendamento{{ agendamentos.length !== 1 ? 's' : '' }}
            </span>
          </div>
          @if (agendamentos.length === 0) {
          <p class="text-center py-8" [style.color]="auth.tema() === 'dark' ? '#6b7280' : '#9ca3af'">Nenhum agendamento para esta data</p>
          } @else { @for (ag of agendamentos; track ag.id) {
          <div class="rounded-lg border p-3" [style.background-color]="auth.tema() === 'dark' ? '#1f2937' : '#ffffff'" [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'">
            <div class="flex items-center gap-4">
              <div class="text-sm font-medium w-20 shrink-0" [style.color]="auth.tema() === 'dark' ? '#d1d5db' : '#374151'">
                {{ ag.dataHoraInicio | date : "HH:mm" }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate" [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'">{{ ag.pacienteNome }}</div>
                <div class="text-sm truncate" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">
                  {{ ag.servicoNome }} · {{ ag.profissionalNome }}
                </div>
              </div>
              <span
                class="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap shrink-0"
                [class.bg-yellow-50]="ag.status === 'Agendado'"
                [class.text-yellow-700]="ag.status === 'Agendado'"
                [class.bg-blue-50]="ag.status === 'Confirmado'"
                [class.text-blue-700]="ag.status === 'Confirmado'"
                [class.bg-green-50]="ag.status === 'Atendido'"
                [class.text-green-700]="ag.status === 'Atendido'"
                [class.bg-red-50]="ag.status === 'Faltou' || ag.status === 'Cancelado'"
                [class.text-red-700]="ag.status === 'Faltou' || ag.status === 'Cancelado'"
                [class.bg-gray-50]="ag.status === 'Remarcado' || ag.status === 'Concluido'"
                [class.text-gray-600]="ag.status === 'Remarcado' || ag.status === 'Concluido'"
              >
                {{ ag.status }}
              </span>
            </div>
            @if (ag.status === 'Agendado' || ag.status === 'Confirmado') {
            <div class="flex gap-2 mt-2 pt-2 border-t" [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#f3f4f6'">
              <button
                type="button"
                (click)="marcarAtendido(ag)"
                title="Marcar paciente como atendido"
                class="px-3 py-1 text-xs font-medium rounded-lg transition"
                [style.color]="auth.corDestaque()"
                [style.background-color]="rgbaDestaque(0.1)"
                (mouseenter)="$any($event.target).style.filter = 'brightness(0.95)'"
                (mouseleave)="$any($event.target).style.filter = ''"
              >Atendido</button>
              <button
                type="button"
                (click)="marcarFaltou(ag)"
                title="Marcar paciente como falta"
                class="px-3 py-1 text-xs font-medium rounded-lg transition text-red-700 bg-red-50 hover:bg-red-100"
              >Faltou</button>
              <button
                type="button"
                (click)="abrirModalReagendar(ag)"
                title="Reagendar para novo horário"
                class="px-3 py-1 text-xs font-medium rounded-lg transition text-blue-700 bg-blue-50 hover:bg-blue-100"
              >Reagendar</button>
              <button
                type="button"
                (click)="excluirAgendamento(ag)"
                title="Excluir agendamento"
                class="px-3 py-1 text-xs font-medium rounded-lg transition text-red-700 bg-red-50 hover:bg-red-100"
              >Excluir</button>
            </div>
            }
          </div>
          } }
        </div>
      </div>

      <!-- Reschedule Modal -->
      @if (modalReagendarAberto) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.5)">
        <div class="rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#ffffff'">
          <h2 class="text-lg font-bold mb-4" [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'">Reagendar Agendamento</h2>

          @if (agendamentoSelecionado) {
          <div class="rounded-lg p-3 mb-4" [style.background-color]="auth.tema() === 'dark' ? '#0f172a' : '#f9fafb'">
            <p class="text-sm font-medium" [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#111827'">{{ agendamentoSelecionado.pacienteNome }}</p>
            <p class="text-xs" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">
              {{ agendamentoSelecionado.servicoNome }} · {{ agendamentoSelecionado.profissionalNome }}
            </p>
            <p class="text-xs mt-1" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">
              Atual: {{ agendamentoSelecionado.dataHoraInicio | date : "dd/MM/yyyy HH:mm" }}
            </p>
          </div>
          }

          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-medium" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Nova Data</label>
              <div class="flex gap-1">
                <button (click)="mesAnteriorReagendar()" [disabled]="!podeVoltarMesReagendar"
                  class="px-2 py-0.5 text-xs border rounded transition disabled:opacity-30 disabled:pointer-events-none"
                  [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
                  [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">‹</button>
                <span class="text-xs font-medium px-1 capitalize"
                  [style.color]="auth.tema() === 'dark' ? '#d1d5db' : '#374151'">{{ mesReagendar | date:"MMM yyyy" }}</span>
                <button (click)="proximoMesReagendar()"
                  class="px-2 py-0.5 text-xs border rounded transition"
                  [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
                  [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">›</button>
              </div>
            </div>
            <div class="grid grid-cols-7 gap-1 mb-1">
              @for (d of diasSemanaMes; track d) {
              <div class="text-center text-[10px] font-medium py-0.5"
                [style.color]="auth.tema() === 'dark' ? '#64748b' : '#9ca3af'">{{ d }}</div>
              }
            </div>
            <div class="grid grid-cols-7 gap-1">
              @for (dia of calendarioReagendar; track $index) {
              <button (click)="diaReagendarClicavel(dia) && selecionarDataReagendar(dia)"
                class="py-1.5 text-[11px] rounded-lg border transition text-center"
                [class.opacity-20]="!ehMesAtualReagendar(dia)"
                [class.opacity-30]="ehMesAtualReagendar(dia) && !diaReagendarTemHorarios(dia)"
                [class.pointer-events-none]="!diaReagendarClicavel(dia)"
                [style.borderColor]="isMesmoDia(dia, dataReagendarSelecionada) ? auth.corDestaque() : 'transparent'"
                [style.backgroundColor]="isMesmoDia(dia, dataReagendarSelecionada) ? rgbaDestaque(0.15) : 'transparent'"
                [style.color]="isMesmoDia(dia, dataReagendarSelecionada) ? auth.corDestaque() : (auth.tema() === 'dark' ? '#d1d5db' : '#374151')">
                {{ dia.getDate() }}
              </button>
              }
            </div>
          </div>

          @if (horariosReagendar.length > 0) {
          <div class="mb-4">
            <label class="block text-xs font-medium mb-2" [style.color]="auth.tema() === 'dark' ? '#9ca3af' : '#6b7280'">Novo Horário</label>
            <div class="grid grid-cols-4 gap-2">
              @for (h of horariosReagendar; track h) {
              <button
                (click)="horarioReagendarSelecionado = h"
                class="px-3 py-2 rounded-lg text-xs font-medium border transition"
                [style.background-color]="horarioReagendarSelecionado === h ? rgbaDestaque(0.15) : 'transparent'"
                [style.color]="horarioReagendarSelecionado === h ? auth.corDestaque() : (auth.tema() === 'dark' ? '#d1d5db' : '#374151')"
                [style.border-color]="horarioReagendarSelecionado === h ? auth.corDestaque() : (auth.tema() === 'dark' ? '#374151' : '#e5e7eb')"
              >{{ h }}</button>
              }
            </div>
          </div>
          }

          @if (erroReagendar) {
          <p class="text-red-500 text-xs mb-2">{{ erroReagendar }}</p>
          }

          <div class="flex gap-2 justify-end">
            <button (click)="fecharModalReagendar()"
              class="px-4 py-2 text-sm rounded-lg border transition"
              [style.color]="auth.tema() === 'dark' ? '#d1d5db' : '#374151'"
              [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'"
            >Cancelar</button>
            <button (click)="confirmarReagendamento()"
              [disabled]="!horarioReagendarSelecionado"
              class="px-4 py-2 text-sm text-white rounded-lg font-medium transition disabled:opacity-50"
              [style.background-color]="auth.corDestaque()"
            >Confirmar Reagendamento</button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  standalone: false,
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  dataSelecionada = new Date();
  mesAtual = new Date();
  calendarioMes: Date[] = [];
  diasSemanaMes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  agendamentos: Agendamento[] = [];
  agendamentosPorDia = new Map<string, number>();
  dataHoje = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  modalReagendarAberto = false;
  agendamentoSelecionado: Agendamento | null = null;
  horariosReagendar: string[] = [];
  dataReagendarSelecionada: Date | null = null;
  horarioReagendarSelecionado: string | null = null;
  erroReagendar = '';
  mesReagendar = new Date();
  calendarioReagendar: Date[] = [];
  diasComHorariosReagendar = new Set<string>();

  ngOnInit() {
    const hoje = new Date();
    this.mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.dataSelecionada = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    this.gerarCalendarioMes();
    this.carregarAgendamentos();
    this.carregarAgendamentosMes();
  }

  private gerarCalendarioMes() {
    const ano = this.mesAtual.getFullYear();
    const mes = this.mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const diaSemanaInicio = primeiroDia.getDay();
    const inicio = new Date(ano, mes, 1 - diaSemanaInicio);
    this.calendarioMes = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  selecionarDia(dia: Date) {
    this.dataSelecionada = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
    this.carregarAgendamentos();
  }

  isMesmoDia(a: Date, b: Date | null) {
    if (!b) return false;
    return a.toDateString() === b.toDateString();
  }

  ehMesAtual(dia: Date): boolean {
    return dia.getMonth() === this.mesAtual.getMonth() &&
           dia.getFullYear() === this.mesAtual.getFullYear();
  }

  temAgendamentos(dia: Date): boolean {
    const key = dia.toISOString().split('T')[0];
    return (this.agendamentosPorDia.get(key) ?? 0) > 0;
  }

  rgbaDestaque(opacity: number): string {
    const hex = this.auth.corDestaque();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  mesAnterior() {
    this.mesAtual = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() - 1, 1);
    this.gerarCalendarioMes();
    this.carregarAgendamentosMes();
  }

  proximoMes() {
    this.mesAtual = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + 1, 1);
    this.gerarCalendarioMes();
    this.carregarAgendamentosMes();
  }

  hoje() {
    const h = new Date();
    this.mesAtual = new Date(h.getFullYear(), h.getMonth(), 1);
    this.dataSelecionada = new Date(h.getFullYear(), h.getMonth(), h.getDate());
    this.dataHoje = new Date(h.getFullYear(), h.getMonth(), h.getDate());
    this.gerarCalendarioMes();
    this.carregarAgendamentos();
    this.carregarAgendamentosMes();
  }

  carregarAgendamentos() {
    const data = this.dataSelecionada.toISOString().split('T')[0];
    this.api.getAgendamentos(data).subscribe({
      next: (res) => {
        this.agendamentos = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar agendamentos:', err),
    });
  }

  private carregarAgendamentosMes() {
    const inicio = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth(), 1);
    const fim = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + 1, 0);
    const inicioStr = inicio.toISOString().split('T')[0];
    const fimStr = fim.toISOString().split('T')[0];
    this.api.getAgendamentos(undefined, undefined, inicioStr, fimStr).subscribe({
      next: (res) => {
        this.agendamentosPorDia = new Map<string, number>();
        for (const ag of res) {
          const key = ag.dataHoraInicio.split('T')[0];
          this.agendamentosPorDia.set(key, (this.agendamentosPorDia.get(key) ?? 0) + 1);
        }
        this.cdr.detectChanges();
      },
    });
  }

  private alterarStatus(ag: Agendamento, status: string, acao: string) {
    if (!confirm(`${acao} "${ag.pacienteNome}"?`)) return;
    this.api.atualizarStatusAgendamento(ag.id, status).subscribe({
      next: () => {
        this.carregarAgendamentos();
        this.carregarAgendamentosMes();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao atualizar status:', err),
    });
  }

  marcarAtendido(ag: Agendamento) {
    this.alterarStatus(ag, 'Atendido', 'Confirmar atendimento de');
  }

  marcarFaltou(ag: Agendamento) {
    this.alterarStatus(ag, 'Faltou', 'Confirmar falta de');
  }

  excluirAgendamento(ag: Agendamento) {
    if (!confirm(`Excluir agendamento de "${ag.pacienteNome}"?`)) return;
    this.api.excluirAgendamento(ag.id).subscribe({
      next: () => {
        this.carregarAgendamentos();
        this.carregarAgendamentosMes();
        this.cdr.detectChanges();
      },
      error: (err) => alert(err.error?.erro || 'Erro ao excluir agendamento'),
    });
  }

  abrirModalReagendar(ag: Agendamento) {
    this.agendamentoSelecionado = ag;
    this.erroReagendar = '';
    this.horarioReagendarSelecionado = null;
    this.dataReagendarSelecionada = null;
    this.horariosReagendar = [];

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    this.mesReagendar = new Date(amanha.getFullYear(), amanha.getMonth(), 1);

    const fim = new Date();
    fim.setDate(fim.getDate() + (this.auth.diasAgenda() || 30) + 1);

    const consultorioId = this.auth.consultorioId();
    let params: any = { dataInicio: amanha.toISOString().split('T')[0], dataFim: fim.toISOString().split('T')[0] };
    if (ag.profissionalId) params.profissionalId = ag.profissionalId;
    else params.servicoId = ag.servicoId;

    this.api.getHorariosDisponiveis(
      consultorioId, params.profissionalId, params.servicoId,
      params.dataInicio, params.dataFim
    ).subscribe({
      next: (res) => {
        (this as any).horariosPorData = res;
        this.diasComHorariosReagendar = new Set(
          res.filter(h => h.horarios.length > 0)
            .map(h => new Date(h.data).toISOString().split('T')[0])
        );
        this.gerarCalendarioReagendar();
        this.modalReagendarAberto = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erroReagendar = 'Erro ao carregar horários disponíveis';
        this.modalReagendarAberto = true;
        this.cdr.detectChanges();
      },
    });
  }

  private gerarCalendarioReagendar() {
    const ano = this.mesReagendar.getFullYear();
    const mes = this.mesReagendar.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const diaSemanaInicio = primeiroDia.getDay();
    const inicio = new Date(ano, mes, 1 - diaSemanaInicio);
    this.calendarioReagendar = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  get podeVoltarMesReagendar(): boolean {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const minMes = new Date(amanha.getFullYear(), amanha.getMonth(), 1);
    return this.mesReagendar > minMes;
  }

  mesAnteriorReagendar() {
    if (!this.podeVoltarMesReagendar) return;
    this.mesReagendar = new Date(this.mesReagendar.getFullYear(), this.mesReagendar.getMonth() - 1, 1);
    this.gerarCalendarioReagendar();
    this.dataReagendarSelecionada = null;
    this.horarioReagendarSelecionado = null;
    this.horariosReagendar = [];
    this.cdr.detectChanges();
  }

  proximoMesReagendar() {
    this.mesReagendar = new Date(this.mesReagendar.getFullYear(), this.mesReagendar.getMonth() + 1, 1);
    this.gerarCalendarioReagendar();
    this.dataReagendarSelecionada = null;
    this.horarioReagendarSelecionado = null;
    this.horariosReagendar = [];
    this.cdr.detectChanges();
  }

  ehMesAtualReagendar(dia: Date): boolean {
    return dia.getMonth() === this.mesReagendar.getMonth() &&
           dia.getFullYear() === this.mesReagendar.getFullYear();
  }

  diaReagendarTemHorarios(dia: Date): boolean {
    const key = dia.toISOString().split('T')[0];
    return this.diasComHorariosReagendar.has(key);
  }

  diaReagendarClicavel(dia: Date): boolean {
    if (!this.ehMesAtualReagendar(dia)) return false;
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);
    const d = new Date(dia);
    d.setHours(0, 0, 0, 0);
    return d >= amanha && this.diaReagendarTemHorarios(dia);
  }

  selecionarDataReagendar(d: Date) {
    this.dataReagendarSelecionada = d;
    this.horarioReagendarSelecionado = null;
    const dataStr = d.toISOString().split('T')[0];
    const horariosData = ((this as any).horariosPorData as HorariosDisponiveis[])
      ?.find(h => h.data.split('T')[0] === dataStr);
    this.horariosReagendar = horariosData?.horarios?.map(h => {
      const parts = h.split(':');
      return `${parts[0]}:${parts[1]}`;
    }) ?? [];
    this.cdr.detectChanges();
  }

  fecharModalReagendar() {
    this.modalReagendarAberto = false;
    this.agendamentoSelecionado = null;
    this.erroReagendar = '';
  }

  confirmarReagendamento() {
    if (!this.agendamentoSelecionado || !this.dataReagendarSelecionada || !this.horarioReagendarSelecionado) return;

    const [hora, minuto] = this.horarioReagendarSelecionado.split(':').map(Number);
    const novaData = new Date(this.dataReagendarSelecionada);
    novaData.setHours(hora, minuto, 0, 0);

    this.api.reagendarAgendamento(this.agendamentoSelecionado.id, novaData.toISOString()).subscribe({
      next: () => {
        this.fecharModalReagendar();
        this.carregarAgendamentos();
        this.carregarAgendamentosMes();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erroReagendar = err.error?.erro || 'Erro ao reagendar';
        this.cdr.detectChanges();
      },
    });
  }
}
