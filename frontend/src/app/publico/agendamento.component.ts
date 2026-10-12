import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { createAuthClient } from '@neondatabase/neon-js/auth';
import { ApiService } from '../services/api.service';
import { PacienteAuthService } from '../services/paciente-auth.service';
import { AppConfig } from '../config/app.config';
import type { Profissional, Servico, HorariosDisponiveis, ConfiguracaoResponse } from '../models/models';

@Component({
  selector: 'app-agendamento',
  template: `
    <div class="space-y-4" [class.dark]="config?.tema === 'dark'">

      <!-- Progress Bar -->
      <div class="rounded-xl shadow-sm border p-4"
        [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
        <div class="flex items-center justify-between mb-3">
          @for (step of steps; track step.key; let i = $index) {
          <button (click)="irPara(i)"
            class="flex flex-col items-center gap-1 text-xs transition cursor-pointer"
            [class.opacity-40]="i > passoAtual"
            [style.color]="i <= passoAtual ? (config?.corPrimaria ?? '#059669') : (config?.tema === 'dark' ? '#64748b' : '#9ca3af')">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition"
              [style.background-color]="i < passoAtual ? (config?.corPrimaria ?? '#059669') : (i === passoAtual ? (config?.corDestaque ?? '#f59e0b') : (config?.tema === 'dark' ? '#334155' : '#e5e7eb'))"
              [style.color]="i <= passoAtual ? '#fff' : (config?.tema === 'dark' ? '#94a3b8' : '#6b7280')">
              {{ i < passoAtual ? '✓' : i + 1 }}
            </div>
            <span class="font-medium hidden sm:inline whitespace-nowrap">{{ step.label }}</span>
          </button>
          @if (i < steps.length - 1) {
          <div class="flex-1 h-0.5 mx-2 rounded"
            [style.background-color]="i < passoAtual ? (config?.corPrimaria ?? '#059669') : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')">
          </div>
          }
          }
        </div>
        <p class="text-xs text-center mt-1" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
          {{ steps[passoAtual].desc }}
        </p>
      </div>

      <!-- Step 0: Welcome -->
      @if (passoAtual === 0) {
      <div class="rounded-xl shadow-sm border p-6 text-center"
        [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'"
        [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#111827'">
        <div class="text-5xl mb-4">🩺</div>
        <h2 class="text-xl font-bold mb-2" [style.color]="config?.tema === 'dark' ? '#f8fafc' : '#111827'">Agende sua consulta</h2>
        <p class="text-sm mb-1" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
          Escolha o profissional, serviço, data e horário em poucos passos.
        </p>
        <details class="text-xs mt-3 text-left" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
          <summary class="cursor-pointer font-medium" [style.color]="config?.corDestaque ?? '#f59e0b'">🔍 Saiba Mais</summary>
          <ul class="mt-2 space-y-1 list-disc list-inside">
            <li>Você pode escolher primeiro o profissional ou o serviço — a ordem é livre.</li>
            <li>Ao selecionar um, a lista do outro é filtrada automaticamente.</li>
            <li>Alguns serviços (ex: exames) não precisam de profissional específico.</li>
            <li>Veja os horários disponíveis e confirme com seus dados.</li>
          </ul>
        </details>
        <button (click)="passoAtual = 1"
          class="mt-4 px-6 py-2.5 text-white rounded-lg font-medium text-sm transition"
          [style.background-color]="config?.corPrimaria ?? '#059669'"
          (mouseenter)="$any($event.target).style.filter='brightness(0.85)'"
          (mouseleave)="$any($event.target).style.filter='none'">
          Começar Agendamento
        </button>
      </div>
      }

      <!-- Step 1: Professional + Service (combined) -->
      @if (passoAtual === 1) {
      <div class="rounded-xl shadow-sm border p-4"
        [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
        <h2 class="font-semibold mb-3" [style.color]="config?.tema === 'dark' ? '#f8fafc' : '#1f2937'">
          Escolha o Profissional e o Serviço
        </h2>
        <p class="text-xs mb-3" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
          Selecione um profissional ou um serviço — a lista ao lado será filtrada automaticamente.
          Alguns serviços não exigem profissional específico.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Professionals column -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium"
                [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">Profissionais</span>
              @if (servicoId) {
              <span class="text-[10px] px-2 py-0.5 rounded-full"
                [style.background-color]="(config?.corDestaque ?? '#f59e0b') + '20'"
                [style.color]="config?.corDestaque ?? '#f59e0b'">filtrado</span>
              }
            </div>
            <input [(ngModel)]="buscaProf" (input)="filtrarProfissionais()" placeholder="Buscar nome…"
              class="w-full px-3 py-2 border rounded-lg text-xs mb-2 outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark'"
              [class.text-white]="config?.tema === 'dark'">
            <div class="space-y-1 max-h-48 overflow-y-auto">
              @for (prof of profissionaisFiltrados; track prof.id) {
              <button (click)="selecionarProfissional(prof)"
                class="w-full text-left px-3 py-2 rounded-lg border text-xs transition flex items-center gap-2"
                [style.borderColor]="profissionalId === prof.id ? (config?.corDestaque ?? '#f59e0b') : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
                [style.backgroundColor]="profissionalId === prof.id ? (config?.corDestaque ?? '#f59e0b') + '18' : (config?.tema === 'dark' ? '#1e293b' : '#fff')"
                [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#111827'">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-[10px]"
                  [style.background-color]="config?.corPrimaria ?? '#059669'">
                  {{ prof.nome.charAt(0) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{{ prof.nome }}</div>
                  @if (prof.especialidade) {
                  <div class="truncate" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">{{ prof.especialidade }}</div>
                  }
                </div>
              </button>
              }
              @empty {
              <p class="text-xs text-center py-4" [style.color]="config?.tema === 'dark' ? '#64748b' : '#9ca3af'">Nenhum</p>
              }
            </div>
          </div>

          <!-- Services column -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium"
                [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">Serviços</span>
              @if (profissionalId) {
              <span class="text-[10px] px-2 py-0.5 rounded-full"
                [style.background-color]="(config?.corDestaque ?? '#f59e0b') + '20'"
                [style.color]="config?.corDestaque ?? '#f59e0b'">filtrado</span>
              }
            </div>
            <input [(ngModel)]="buscaServ" (input)="filtrarServicos()" placeholder="Buscar serviço…"
              class="w-full px-3 py-2 border rounded-lg text-xs mb-2 outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark'"
              [class.text-white]="config?.tema === 'dark'">
            <div class="space-y-1 max-h-48 overflow-y-auto">
              @for (serv of servicosFiltrados; track serv.id) {
              <button (click)="selecionarServico(serv)"
                class="w-full text-left px-3 py-2 rounded-lg border text-xs transition"
                [style.borderColor]="servicoId === serv.id ? (config?.corDestaque ?? '#f59e0b') : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
                [style.backgroundColor]="servicoId === serv.id ? (config?.corDestaque ?? '#f59e0b') + '18' : (config?.tema === 'dark' ? '#1e293b' : '#fff')"
                [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#111827'">
                <div class="flex items-center justify-between">
                  <div class="min-w-0 flex-1">
                    <span class="font-medium truncate">{{ serv.nome }}</span>
                    @if (serv.descricao) {
                    <div class="truncate" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">{{ serv.descricao }}</div>
                    }
                  </div>
                  <div class="text-right shrink-0 ml-2">
                    <div class="font-semibold" [style.color]="config?.corDestaque ?? '#f59e0b'">R$ {{ serv.preco.toFixed(2) }}</div>
                    <div class="text-[10px]" [style.color]="config?.tema === 'dark' ? '#64748b' : '#9ca3af'">{{ serv.duracaoMinutos }}min</div>
                  </div>
                </div>
              </button>
              }
              @empty {
              <p class="text-xs text-center py-4" [style.color]="config?.tema === 'dark' ? '#64748b' : '#9ca3af'">Nenhum</p>
              }
            </div>
          </div>
        </div>

        @if (podeAvancarStep1) {
        <div class="flex justify-end mt-3 pt-3 border-t"
          [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
          <button (click)="entrarStep2()"
            class="px-4 py-2 text-white rounded-lg text-sm font-medium transition"
            [style.background-color]="config?.corPrimaria ?? '#059669'"
            (mouseenter)="$any($event.target).style.filter='brightness(0.85)'"
            (mouseleave)="$any($event.target).style.filter='none'">
            Escolher Horário →
          </button>
        </div>
        }
      </div>
      }

      <!-- Step 2: Date & Time -->
      @if (passoAtual === 2) {
      <div class="rounded-xl shadow-sm border p-4"
        [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
        <h2 class="font-semibold mb-3" [style.color]="config?.tema === 'dark' ? '#f8fafc' : '#1f2937'">Escolha a Data e Horário</h2>

        <div class="flex items-center justify-between mb-3">
          <button (click)="mesAnterior()" [disabled]="!podeVoltarMes"
            class="px-3 py-1.5 text-sm border rounded-lg transition disabled:opacity-30 disabled:pointer-events-none"
            [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'"
            [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
            ‹
          </button>
          <span class="font-medium text-sm" [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#374151'">
            {{ mesAtual | date:"MMMM 'de' yyyy" }}
          </span>
          <button (click)="proximoMes()" [disabled]="!podeAvancarMes"
            class="px-3 py-1.5 text-sm border rounded-lg transition disabled:opacity-30 disabled:pointer-events-none"
            [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'"
            [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
            ›
          </button>
        </div>

        <div class="grid grid-cols-7 gap-1 mb-1">
          @for (d of diasSemanaMes; track d) {
          <div class="text-center text-[10px] font-medium py-1"
            [style.color]="config?.tema === 'dark' ? '#64748b' : '#9ca3af'">{{ d }}</div>
          }
        </div>

        <div class="relative">
        @if (carregandoHorarios) {
        <div class="absolute inset-0 flex items-center justify-center z-10 rounded-lg"
          [style.background-color]="config?.tema === 'dark' ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.7)'">
          <div class="flex items-center gap-2 text-sm"
            [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Carregando horários...
          </div>
        </div>
        }
        <div class="grid grid-cols-7 gap-1 mb-4" [class.opacity-40]="carregandoHorarios">
          @for (dia of calendarioMes; track $index) {
          <button (click)="diaClicavel(dia) && selecionarData(dia)"
            class="py-2 text-xs rounded-lg border transition text-center"
            [class.opacity-20]="!ehMesAtual(dia)"
            [class.opacity-30]="ehMesAtual(dia) && !ehPassado(dia) && !diaTemHorarios(dia)"
            [class.pointer-events-none]="!diaClicavel(dia) || carregandoHorarios"
            [style.borderColor]="isMesmoDia(dia, dataSelecionada) ? (config?.corDestaque ?? '#f59e0b') : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
            [style.backgroundColor]="isMesmoDia(dia, dataSelecionada) ? (config?.corDestaque ?? '#f59e0b') + '18' : (config?.tema === 'dark' ? '#1e293b' : '#fff')"
            [style.color]="isMesmoDia(dia, dataSelecionada) ? (config?.corDestaque ?? '#f59e0b') : (ehMesAtual(dia) && !ehPassado(dia) && diaTemHorarios(dia) ? (config?.tema === 'dark' ? '#f1f5f9' : '#111827') : (config?.tema === 'dark' ? '#475569' : '#d1d5db'))">
            <div class="font-medium">{{ dia.getDate() }}</div>
            @if (ehMesAtual(dia) && !ehPassado(dia) && diaTemHorarios(dia) && !isMesmoDia(dia, dataSelecionada)) {
            <div class="w-1 h-1 rounded-full mx-auto mt-0.5"
              [style.background-color]="config?.corPrimaria ?? '#059669'"></div>
            }
          </button>
          }
        </div>
        </div>

        @if (dataSelecionada) {
        <div class="border-t pt-3" [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
          <p class="text-sm font-medium mb-2" [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#374151'">
            Horários para {{ dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) }}
          </p>
          @if (horariosData.length > 0) {
          <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
            @for (time of horariosData; track time) {
            <button (click)="horarioSelecionado = time"
              class="p-2 text-xs rounded-lg border text-center transition"
              [style.borderColor]="horarioSelecionado === time ? (config?.corDestaque ?? '#f59e0b') : (config?.tema === 'dark' ? '#334155' : '#e5e7eb')"
              [style.backgroundColor]="horarioSelecionado === time ? (config?.corDestaque ?? '#f59e0b') + '18' : (config?.tema === 'dark' ? '#1e293b' : '#fff')"
              [style.color]="horarioSelecionado === time ? (config?.corDestaque ?? '#f59e0b') : (config?.tema === 'dark' ? '#f1f5f9' : '#111827')">
              {{ time.substring(0,5) }}
            </button>
            }
          </div>
          } @else {
          <p class="text-sm text-center py-4" [style.color]="config?.tema === 'dark' ? '#64748b' : '#9ca3af'">Nenhum horário disponível nesta data</p>
          }
        </div>
        }

        @if (horarioSelecionado) {
        <div class="flex justify-end mt-3 pt-3 border-t"
          [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
          <button (click)="entrarStep3()"
            class="px-4 py-2 text-white rounded-lg text-sm font-medium transition"
            [style.background-color]="config?.corPrimaria ?? '#059669'"
            (mouseenter)="$any($event.target).style.filter='brightness(0.85)'"
            (mouseleave)="$any($event.target).style.filter='none'">
            Revisar e Confirmar →
          </button>
        </div>
        }
      </div>
      }

      <!-- Step 3: Review & Confirm -->
      @if (passoAtual === 3) {
      <div class="rounded-xl shadow-sm border p-4"
        [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
        [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'">
        <h2 class="font-semibold mb-3" [style.color]="config?.tema === 'dark' ? '#f8fafc' : '#1f2937'">Revisão e Confirmação</h2>

        <div class="space-y-2 text-sm mb-4 p-4 rounded-lg"
          [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#f9fafb'"
          [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#374151'">
          <div class="flex justify-between">
            <span [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">Profissional:</span>
            <span class="font-medium">{{ profissionalNome || 'Qualquer disponível' }}</span>
          </div>
          <div class="flex justify-between">
            <span [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">Serviço:</span>
            <span class="font-medium">{{ servicoNome }}</span>
          </div>
          <div class="flex justify-between">
            <span [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">Valor:</span>
            <span class="font-semibold" [style.color]="config?.corDestaque ?? '#f59e0b'">R$ {{ servicoPreco.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">Duração:</span>
            <span>{{ duracaoMin }} minutos</span>
          </div>
          <div class="border-t my-2" [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'"></div>
          <div class="flex justify-between">
            <span [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">Data:</span>
            <span class="font-medium">{{ dataFormatada }}</span>
          </div>
          <div class="flex justify-between">
            <span [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">Horário:</span>
            <span class="font-medium">{{ horarioSelecionado }}</span>
          </div>
        </div>

        @if (appConfig.neonAuthUrl && !sucesso) {
        <div class="mb-4 p-4 rounded-lg border"
          [style.border-color]="config?.tema === 'dark' ? '#334155' : '#e5e7eb'"
          [style.background-color]="config?.tema === 'dark' ? '#0f172a' : '#f9fafb'">
          @if (googleCarregando) {
          <p class="text-sm text-center" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
            Conectando com Google...
          </p>
          } @else if (googleConectado) {
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-sm min-w-0">
              <span class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                [style.background-color]="(config?.corPrimaria ?? '#059669') + '1a'">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                  [style.color]="config?.corPrimaria ?? '#059669'">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              <div class="min-w-0">
                <div class="font-medium truncate" [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#1f2937'">
                  Conectado como {{ pacNome }}
                </div>
                <div class="text-xs truncate" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">{{ pacEmail }}</div>
              </div>
            </div>
            <button type="button" (click)="desconectarGoogle()"
              class="text-xs underline shrink-0"
              [style.color]="config?.corDestaque ?? '#f59e0b'">sair</button>
          </div>
          } @else {
          <p class="text-xs font-medium mb-2" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">
            Entre com Google para preencher seus dados automaticamente
          </p>
          <button type="button" (click)="entrarComGoogle()"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition"
            [style.border-color]="config?.tema === 'dark' ? '#475569' : '#d1d5db'"
            [style.background-color]="config?.tema === 'dark' ? '#1e293b' : '#fff'"
            [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#374151'"
            (mouseenter)="$any($event.target).style.backgroundColor=(config?.tema === 'dark' ? '#334155' : '#f7f7f7')"
            (mouseleave)="$any($event.target).style.backgroundColor=''">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Entrar com Google
          </button>
          }
        </div>
        }

        <form (ngSubmit)="confirmar()" class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1"
              [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">Nome <span class="text-red-500">*</span></label>
            <input [(ngModel)]="pacNome" name="nome" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark' && !nomeInvalido"
              [class.text-white]="config?.tema === 'dark'"
              [style.borderColor]="nomeInvalido ? '#ef4444' : (config?.tema === 'dark' ? '#475569' : '#d1d5db')"
              [style.boxShadow]="nomeInvalido ? '0 0 0 1px #ef4444' : (focusedInput === 'nome' ? '0 0 0 2px ' + (config?.corSecundaria ?? '#10b981') : '0 0 0 1px transparent')"
              (focus)="focusedInput = 'nome'" (blur)="focusedInput = ''">
            @if (nomeInvalido) {
            <p class="text-red-500 text-xs mt-1">Nome é obrigatório</p>
            }
          </div>
          <div>
            <label class="block text-sm font-medium mb-1"
              [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">Email <span class="text-xs font-normal opacity-60">(Opcional)</span></label>
            <input type="email" [(ngModel)]="pacEmail" name="email"
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark'"
              [class.text-white]="config?.tema === 'dark'"
              [style.boxShadow]="focusedInput === 'email' ? '0 0 0 2px ' + (config?.corSecundaria ?? '#10b981') : '0 0 0 1px transparent'"
              (focus)="focusedInput = 'email'" (blur)="focusedInput = ''">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1"
              [style.color]="config?.tema === 'dark' ? '#e2e8f0' : '#374151'">Celular <span class="text-red-500">*</span></label>
            <input type="tel" [(ngModel)]="pacCelular" name="celular" required
              class="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              [class.bg-slate-700]="config?.tema === 'dark'"
              [class.border-slate-600]="config?.tema === 'dark' && !celularInvalido"
              [class.text-white]="config?.tema === 'dark'"
              [style.borderColor]="celularInvalido ? '#ef4444' : (config?.tema === 'dark' ? '#475569' : '#d1d5db')"
              [style.boxShadow]="celularInvalido ? '0 0 0 1px #ef4444' : (focusedInput === 'celular' ? '0 0 0 2px ' + (config?.corSecundaria ?? '#10b981') : '0 0 0 1px transparent')"
              (focus)="focusedInput = 'celular'" (blur)="focusedInput = ''">
            @if (celularInvalido) {
            <p class="text-red-500 text-xs mt-1">Celular é obrigatório</p>
            }
          </div>

          @if (erro) {
          <p class="text-red-500 text-sm">{{ erro }}</p>
          }

          @if (sucesso) {
          <div class="rounded-lg p-4 text-center"
            [style.background-color]="(config?.corPrimaria ?? '#059669') + '12'"
            [style.border]="'1px solid ' + (config?.corPrimaria ?? '#059669') + '30'">
            <p class="font-medium text-base"
              [style.color]="config?.corPrimaria ?? '#059669'">✅ Agendamento confirmado!</p>
            <p class="text-sm mt-1" [style.color]="config?.tema === 'dark' ? '#94a3b8' : '#6b7280'">Você receberá um lembrete no dia.</p>
            <button (click)="reiniciar()"
              class="mt-3 px-4 py-2 text-white rounded-lg text-sm font-medium transition"
              [style.background-color]="config?.corPrimaria ?? '#059669'">
              Novo Agendamento
            </button>
          </div>
          }

          @if (!sucesso) {
          <div class="flex gap-3">
            <button type="button" (click)="passoAtual = 2"
              class="flex-1 py-3 rounded-lg text-sm font-medium border transition flex items-center justify-center gap-2"
              [style.border-color]="config?.tema === 'dark' ? '#475569' : '#d1d5db'"
              [style.color]="config?.tema === 'dark' ? '#f1f5f9' : '#374151'"
              (mouseenter)="$any($event.target).style.backgroundColor=(config?.tema === 'dark' ? '#334155' : '#f3f4f6')"
              (mouseleave)="$any($event.target).style.backgroundColor=''">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              Voltar
            </button>
            <button type="submit"
              class="flex-1 text-white py-3 rounded-lg text-sm font-medium transition"
              [style.background-color]="config?.corPrimaria ?? '#059669'"
              (mouseenter)="$any($event.target).style.filter='brightness(0.85)'"
              (mouseleave)="$any($event.target).style.filter='none'">
              Confirmar Agendamento
            </button>
          </div>
          }
        </form>
      </div>
      }
    </div>
  `,
  standalone: false,
})
export class AgendamentoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private pacienteAuth = inject(PacienteAuthService);
  private cdr = inject(ChangeDetectorRef);

  consultorioId = '';
  config: ConfiguracaoResponse | null = null;

  steps = [
    { key: 'inicio', label: 'Início', desc: 'Boas-vindas e instruções' },
    { key: 'escolha', label: 'Escolha', desc: 'Selecione profissional e serviço' },
    { key: 'horario', label: 'Data/Hora', desc: 'Escolha a melhor data e horário' },
    { key: 'confirmar', label: 'Confirmar', desc: 'Revise e confirme seu agendamento' },
  ];
  passoAtual = 0;

  profissionais: Profissional[] = [];
  profissionaisFiltrados: Profissional[] = [];
  servicos: Servico[] = [];
  servicosFiltrados: Servico[] = [];
  horariosDisponiveis: HorariosDisponiveis[] = [];

  profissionalId = '';
  profissionalNome = '';
  servicoId = '';
  servicoNome = '';
  servicoPreco = 0;
  servicoSemProfissional = false;
  duracaoMin = 30;
  horarioSelecionado = '';

  buscaProf = '';
  buscaServ = '';

  mesAtual = new Date();
  calendarioMes: Date[] = [];
  diasSemanaMes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  diasComHorarios = new Set<string>();
  dataSelecionada: Date | null = null;
  horariosData: string[] = [];
  carregandoHorarios = false;

  pacNome = '';
  pacEmail = '';
  pacCelular = '';
  erro = '';
  sucesso = '';
  focusedInput = '';
  submitted = false;

  readonly appConfig = AppConfig;
  googleConectado = false;
  googleCarregando = false;
  private neonClient: any = null;

  get nomeInvalido(): boolean {
    return this.submitted && !this.pacNome.trim();
  }

  get celularInvalido(): boolean {
    return this.submitted && !this.pacCelular.trim();
  }

  ngOnInit() {
    this.consultorioId = this.route.snapshot.params['consultorioId'];
    this.restaurarDraft();
    this.preencherComPacienteLogado();

    this.api.getConfiguracaoPublica(this.consultorioId).subscribe({
      next: (res) => {
        this.config = res;
        this.cdr.detectChanges();
      },
    });

    this.carregarProfissionaisServicos();

    if (this.route.snapshot.queryParams['via'] === 'google') {
      this.conectarGoogle();
    }
  }

  private preencherComPacienteLogado() {
    if (!this.pacienteAuth.isLoggedIn(this.consultorioId)) return;
    if (!this.pacNome) this.pacNome = this.pacienteAuth.nome();
    if (!this.pacEmail) this.pacEmail = this.pacienteAuth.email();
    const celular = this.pacienteAuth.telefoneCelular();
    if (!this.pacCelular && celular) this.pacCelular = celular;
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

  get podeVoltarMes(): boolean {
    const agora = new Date();
    return this.mesAtual.getMonth() !== agora.getMonth() ||
           this.mesAtual.getFullYear() !== agora.getFullYear();
  }

  get podeAvancarMes(): boolean {
    const limite = new Date();
    limite.setMonth(limite.getMonth() + 3);
    const proximoMes = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + 1, 1);
    return proximoMes <= limite;
  }

  mesAnterior() {
    if (!this.podeVoltarMes) return;
    this.mesAtual = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() - 1, 1);
    this.gerarCalendarioMes();
    this.dataSelecionada = null;
    this.horarioSelecionado = '';
    this.horariosData = [];
    this.carregarHorarios();
  }

  proximoMes() {
    if (!this.podeAvancarMes) return;
    this.mesAtual = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + 1, 1);
    this.gerarCalendarioMes();
    this.dataSelecionada = null;
    this.horarioSelecionado = '';
    this.horariosData = [];
    this.carregarHorarios();
  }

  ehMesAtual(dia: Date): boolean {
    return dia.getMonth() === this.mesAtual.getMonth() &&
           dia.getFullYear() === this.mesAtual.getFullYear();
  }

  ehPassado(dia: Date): boolean {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);
    const d = new Date(dia);
    d.setHours(0, 0, 0, 0);
    return d < amanha;
  }

  isMesmoDia(a: Date, b: Date | null): boolean {
    if (!b) return false;
    return a.toDateString() === b.toDateString();
  }

  diaClicavel(dia: Date): boolean {
    return this.ehMesAtual(dia) && !this.ehPassado(dia) && this.diaTemHorarios(dia);
  }

  private carregarProfissionaisServicos(autoSelecionar = false) {
    this.api.getProfissionaisPublico(this.consultorioId, this.servicoId || undefined).subscribe({
      next: (res) => {
        this.profissionais = res;
        this.filtrarProfissionais();
        if (this.profissionalId && !res.find(p => p.id === this.profissionalId)) {
          this.limparSelecaoProfissional();
        }
        if (autoSelecionar && this.servicoId && !this.profissionalId && res.length === 1) {
          this.profissionalId = res[0].id;
          this.profissionalNome = res[0].nome;
        }
        this.cdr.detectChanges();
      },
    });
    this.api.getServicosPublico(this.consultorioId, this.profissionalId || undefined).subscribe({
      next: (res) => {
        this.servicos = this.profissionalId ? res.filter(s => !s.semProfissional) : res;
        this.filtrarServicos();
        if (this.servicoId && !this.servicos.find(s => s.id === this.servicoId)) {
          this.limparSelecaoServico();
        }
        if (autoSelecionar && this.profissionalId && !this.servicoId && this.servicos.length === 1) {
          const serv = this.servicos[0];
          this.servicoId = serv.id;
          this.servicoNome = serv.nome;
          this.servicoPreco = serv.preco;
          this.duracaoMin = serv.duracaoMinutos;
          this.servicoSemProfissional = serv.semProfissional;
        }
        this.cdr.detectChanges();
      },
    });
  }

  irPara(passo: number) {
    if (passo <= this.passoAtual) {
      this.passoAtual = passo;
    }
  }

  get podeAvancarStep1(): boolean {
    if (!this.servicoId) return false;
    if (this.servicoSemProfissional) return true;
    return !!this.profissionalId;
  }

  entrarStep2() {
    this.passoAtual = 2;
    const hoje = new Date();
    this.mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.gerarCalendarioMes();
    this.carregarHorarios();
  }

  diaTemHorarios(dia: Date): boolean {
    if (this.horariosDisponiveis.length === 0) return false;
    const key = dia.toISOString().split('T')[0];
    return this.diasComHorarios.has(key);
  }

  filtrarProfissionais() {
    const q = this.buscaProf.toLowerCase();
    this.profissionaisFiltrados = this.profissionais.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      (p.especialidade ?? '').toLowerCase().includes(q)
    );
  }

  filtrarServicos() {
    const q = this.buscaServ.toLowerCase();
    this.servicosFiltrados = this.servicos.filter(s =>
      s.nome.toLowerCase().includes(q) ||
      (s.descricao ?? '').toLowerCase().includes(q)
    );
  }

  selecionarProfissional(prof: Profissional) {
    const estavaSelecionado = this.profissionalId === prof.id;
    if (estavaSelecionado) {
      this.limparSelecaoProfissional();
    } else {
      this.profissionalId = prof.id;
      this.profissionalNome = prof.nome;
    }
    this.carregarProfissionaisServicos(true);
    this.limparHorarios();
  }

  selecionarServico(serv: Servico) {
    const estavaSelecionado = this.servicoId === serv.id;
    if (estavaSelecionado) {
      this.limparSelecaoServico();
    } else {
      this.servicoId = serv.id;
      this.servicoNome = serv.nome;
      this.servicoPreco = serv.preco;
      this.duracaoMin = serv.duracaoMinutos;
      this.servicoSemProfissional = serv.semProfissional;
    }
    this.carregarProfissionaisServicos(true);
    this.limparHorarios();
  }

  private limparSelecaoProfissional() {
    this.profissionalId = '';
    this.profissionalNome = '';
  }

  private limparSelecaoServico() {
    this.servicoId = '';
    this.servicoNome = '';
    this.servicoPreco = 0;
    this.duracaoMin = 30;
    this.servicoSemProfissional = false;
  }

  private limparHorarios() {
    this.horariosDisponiveis = [];
    this.dataSelecionada = null;
    this.horarioSelecionado = '';
    this.horariosData = [];
  }

  selecionarData(dia: Date) {
    this.dataSelecionada = dia;
    this.horarioSelecionado = '';
    this.carregarHorariosData(dia);
  }

  private carregarHorariosData(dia: Date) {
    const dataStr = dia.toISOString().split('T')[0];
    const horario = this.horariosDisponiveis.find(h => {
      const hDate = new Date(h.data);
      return hDate.toISOString().split('T')[0] === dataStr;
    });
    this.horariosData = horario?.horarios.map(t =>
      typeof t === 'string' ? t.substring(0, 5) : t
    ) ?? [];
    this.cdr.detectChanges();
  }

  private carregarHorarios() {
    if (!this.profissionalId && !this.servicoSemProfissional) return;

    const inicio = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth(), 1);
    const fim = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + 1, 0);
    const inicioStr = inicio.toISOString().split('T')[0];
    const fimStr = fim.toISOString().split('T')[0];

    this.carregandoHorarios = true;
    this.api.getHorariosDisponiveis(
      this.consultorioId,
      this.profissionalId || undefined,
      this.servicoId || undefined,
      inicioStr,
      fimStr
    ).subscribe({
      next: (res) => {
        this.horariosDisponiveis = res;
        this.diasComHorarios = new Set(
          res.filter(h => h.horarios.length > 0)
            .map(h => new Date(h.data).toISOString().split('T')[0])
        );
        this.carregandoHorarios = false;
        if (this.dataSelecionada) this.carregarHorariosData(this.dataSelecionada);
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoHorarios = false;
        this.cdr.detectChanges();
      },
    });
  }

  get dataFormatada(): string {
    if (!this.dataSelecionada) return '';
    return this.dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  private clientNeon(): any {
    if (!this.neonClient) {
      this.neonClient = createAuthClient(AppConfig.neonAuthUrl);
    }
    return this.neonClient;
  }

  entrarStep3() {
    this.passoAtual = 3;
  }

  async entrarComGoogle() {
    this.salvarDraft();
    this.erro = '';
    this.googleCarregando = true;
    this.cdr.detectChanges();
    try {
      const callbackURL = `${window.location.origin}/p/${this.consultorioId}?via=google`;
      await this.clientNeon().signIn.social({ provider: 'google', callbackURL });
    } catch {
      this.googleCarregando = false;
      this.erro = 'Falha ao entrar com Google. Tente novamente.';
      this.cdr.detectChanges();
    }
  }

  private async conectarGoogle() {
    this.googleCarregando = true;
    const token = await this.obterTokenNeon();
    if (!token) {
      this.googleCarregando = false;
      this.erro = 'Não foi possível conectar sua conta Google. Tente novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.api.loginGoogle(this.consultorioId, token).subscribe({
      next: (res) => {
        this.googleCarregando = false;
        this.googleConectado = true;
        this.pacienteAuth.aplicarLoginGoogle(res);
        this.pacNome = res.nome;
        this.pacEmail = res.email ?? '';
        if (res.telefoneCelular) this.pacCelular = res.telefoneCelular;
        this.cdr.detectChanges();
      },
      error: () => {
        this.googleCarregando = false;
        this.erro = 'Falha ao conectar com Google. Tente novamente.';
        this.cdr.detectChanges();
      },
    });
  }

  private async obterTokenNeon(): Promise<string | null> {
    try {
      const { data } = await this.clientNeon().getSession();
      const sessao = data?.session as { token?: string } | null | undefined;
      return sessao?.token ?? null;
    } catch {
      return null;
    }
  }

  private draftKey(): string {
    return `agenda:${this.consultorioId}`;
  }

  private salvarDraft() {
    try {
      sessionStorage.setItem(this.draftKey(), JSON.stringify({
        passoAtual: this.passoAtual,
        profissionalId: this.profissionalId,
        profissionalNome: this.profissionalNome,
        servicoId: this.servicoId,
        servicoNome: this.servicoNome,
        servicoPreco: this.servicoPreco,
        duracaoMin: this.duracaoMin,
        servicoSemProfissional: this.servicoSemProfissional,
        horarioSelecionado: this.horarioSelecionado,
        dataISO: this.dataSelecionada ? this.dataSelecionada.toISOString() : null,
        mesISO: this.mesAtual.toISOString(),
        buscaProf: this.buscaProf,
        buscaServ: this.buscaServ,
        pacNome: this.pacNome,
        pacEmail: this.pacEmail,
        pacCelular: this.pacCelular,
      }));
    } catch { /* ignore */ }
  }

  private restaurarDraft() {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(this.draftKey());
    } catch {
      return;
    }
    if (!raw) return;

    try {
      const d = JSON.parse(raw) as Record<string, unknown>;
      const str = (k: string): string => (typeof d[k] === 'string' ? (d[k] as string) : '');
      const num = (k: string): number => (typeof d[k] === 'number' ? (d[k] as number) : 0);
      const bool = (k: string): boolean => d[k] === true;

      this.passoAtual = num('passoAtual');
      this.profissionalId = str('profissionalId');
      this.profissionalNome = str('profissionalNome');
      this.servicoId = str('servicoId');
      this.servicoNome = str('servicoNome');
      this.servicoPreco = num('servicoPreco');
      this.duracaoMin = num('duracaoMin');
      this.servicoSemProfissional = bool('servicoSemProfissional');
      this.horarioSelecionado = str('horarioSelecionado');
      this.buscaProf = str('buscaProf');
      this.buscaServ = str('buscaServ');
      this.pacNome = str('pacNome');
      this.pacEmail = str('pacEmail');
      this.pacCelular = str('pacCelular');
      const dataISO = str('dataISO');
      const mesISO = str('mesISO');
      if (dataISO) this.dataSelecionada = new Date(dataISO);
      if (mesISO) this.mesAtual = new Date(mesISO);
      sessionStorage.removeItem(this.draftKey());
    } catch { /* ignore */ }

    if (this.passoAtual >= 2) {
      this.gerarCalendarioMes();
      this.carregarHorarios();
      this.cdr.detectChanges();
    }
  }

  desconectarGoogle() {
    this.googleConectado = false;
  }

  confirmar() {
    this.submitted = true;
    if (!this.horarioSelecionado) return;
    if (!this.pacNome.trim() || !this.pacCelular.trim()) {
      this.cdr.detectChanges();
      return;
    }
    this.erro = '';
    this.sucesso = '';

    if (!this.pacienteAuth.isLoggedIn(this.consultorioId)) {
      this.salvarDraft();
      this.router.navigate(['/p', this.consultorioId, 'entrar'], {
        queryParams: { redirect: `/p/${this.consultorioId}` },
      });
      return;
    }

    this.api.agendarPublico(this.consultorioId, {
      profissionalId: this.profissionalId || null,
      servicoId: this.servicoId,
      dataHoraInicio: this.dataSelecionada!.toISOString().split('T')[0] + 'T' + this.horarioSelecionado + ':00',
      nome: this.pacNome,
      email: this.pacEmail,
      telefoneCelular: this.pacCelular,
    }).subscribe({
      next: () => {
        this.sucesso = 'Agendamento confirmado!';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erro = err.status === 409
          ? 'Horário indisponível. Tente outro horário.'
          : 'Erro ao agendar. Verifique seus dados.';
        this.cdr.detectChanges();
      },
    });
  }

  reiniciar() {
    this.passoAtual = 1;
    this.profissionalId = '';
    this.profissionalNome = '';
    this.servicoId = '';
    this.servicoNome = '';
    this.servicoPreco = 0;
    this.servicoSemProfissional = false;
    this.duracaoMin = 30;
    this.horarioSelecionado = '';
    this.pacNome = '';
    this.pacEmail = '';
    this.pacCelular = '';
    this.erro = '';
    this.sucesso = '';
    this.submitted = false;
    this.googleConectado = false;
    this.googleCarregando = false;
    this.dataSelecionada = null;
    this.horariosData = [];
    this.carregandoHorarios = false;
    this.buscaProf = '';
    this.buscaServ = '';
    this.limparHorarios();
    this.carregarProfissionaisServicos();
  }
}
