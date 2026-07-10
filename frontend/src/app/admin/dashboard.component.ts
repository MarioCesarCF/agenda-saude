import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import type { Agendamento, Profissional } from '../models/models';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold" [style.color]="auth.tema() === 'dark' ? '#f3f4f6' : '#1f2937'">Agenda</h1>
        <div class="flex gap-2">
          <button
            (click)="voltar()"
            class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
            [style.color]="auth.tema() === 'dark' ? '#d1d5db' : '#374151'"
          >
            ←
          </button>
          <h2 class="px-4 py-1.5 font-medium" [style.color]="auth.tema() === 'dark' ? '#e5e7eb' : '#374151'">
            {{ dataSelecionada | date : "dd 'de' MMMM 'de' yyyy" }}
          </h2>
          <button
            (click)="avancar()"
            class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
            [style.color]="auth.tema() === 'dark' ? '#d1d5db' : '#374151'"
          >
            →
          </button>
          <button
            (click)="hoje()"
            class="px-3 py-1.5 text-sm text-white rounded-lg"
            [style.background-color]="auth.corPrimaria()"
            (mouseenter)="$any($event.target).style.filter = 'brightness(0.9)'"
            (mouseleave)="$any($event.target).style.filter = ''"
          >
            Hoje
          </button>
        </div>
      </div>

      <div class="rounded-xl shadow-sm border" [style.background-color]="auth.tema() === 'dark' ? '#111827' : '#ffffff'">
        <div class="p-4 border-b" [style.border-color]="auth.tema() === 'dark' ? '#374151' : '#e5e7eb'">
          <div class="flex gap-4 overflow-x-auto">
            @for (dia of semana; track dia) {
            <button
              (click)="selecionarDia(dia)"
              class="px-4 py-2 rounded-lg text-sm text-center min-w-[80px]"
              [style.background-color]="isMesmoDia(dia, dataSelecionada) ? rgbaDestaque(0.1) : 'transparent'"
              [style.color]="isMesmoDia(dia, dataSelecionada) ? auth.corDestaque() : (auth.tema() === 'dark' ? '#9ca3af' : '#6b7280')"
              [class.font-semibold]="isMesmoDia(dia, dataSelecionada)"
            >
              <div>{{ dia | date : "EEE" }}</div>
              <div class="text-lg">{{ dia | date : "dd" }}</div>
            </button>
            }
          </div>
        </div>

        <div class="p-4 space-y-2">
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
              >✅ Atendido</button>
              <button
                type="button"
                (click)="marcarFaltou(ag)"
                title="Marcar paciente como falta"
                class="px-3 py-1 text-xs font-medium rounded-lg transition text-red-700 bg-red-50 hover:bg-red-100"
              >❌ Faltou</button>
              <button
                type="button"
                (click)="marcarRemarcado(ag)"
                title="Marcar agendamento como remarcado"
                class="px-3 py-1 text-xs font-medium rounded-lg transition text-blue-700 bg-blue-50 hover:bg-blue-100"
              >🔄 Reagendar</button>
            </div>
            }
          </div>
          } }
        </div>
      </div>
    </div>
  `,
  standalone: false,
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  dataSelecionada = new Date();
  semana: Date[] = [];
  agendamentos: Agendamento[] = [];

  ngOnInit() {
    this.gerarSemana();
    this.carregarAgendamentos();
  }

  gerarSemana() {
    const inicio = new Date(this.dataSelecionada);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    this.semana = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  selecionarDia(dia: Date) {
    this.dataSelecionada = dia;
    this.gerarSemana();
    this.carregarAgendamentos();
  }

  isMesmoDia(a: Date, b: Date) {
    return a.toDateString() === b.toDateString();
  }

  rgbaDestaque(opacity: number): string {
    const hex = this.auth.corDestaque();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  voltar() {
    this.dataSelecionada.setDate(this.dataSelecionada.getDate() - 7);
    this.gerarSemana();
    this.carregarAgendamentos();
  }

  avancar() {
    this.dataSelecionada.setDate(this.dataSelecionada.getDate() + 7);
    this.gerarSemana();
    this.carregarAgendamentos();
  }

  hoje() {
    this.dataSelecionada = new Date();
    this.gerarSemana();
    this.carregarAgendamentos();
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

  private alterarStatus(ag: Agendamento, status: string, acao: string) {
    if (!confirm(`${acao} "${ag.pacienteNome}"?`)) return;
    this.api.atualizarStatusAgendamento(ag.id, status).subscribe({
      next: () => {
        this.carregarAgendamentos();
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

  marcarRemarcado(ag: Agendamento) {
    this.alterarStatus(ag, 'Remarcado', 'Remarcar agendamento de');
  }
}
