import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import type { ConfiguracaoResponse } from '../models/models';

@Component({
  selector: 'app-configuracao',
  standalone: false,
  template: `
    <div class="max-w-3xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold" [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">Configuração da Clínica</h1>

      <div class="rounded-xl shadow-sm p-6 space-y-5"
        [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#fff'">
        <div>
          <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Nome da Clínica</label>
          <input [(ngModel)]="form.nomeFantasia"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            [class.bg-slate-700]="auth.tema() === 'dark'"
            [class.border-slate-600]="auth.tema() === 'dark'"
            [class.text-white]="auth.tema() === 'dark'">
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Tema</label>
          <div class="flex gap-3">
            <button (click)="form.tema = 'light'"
              class="flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition"
              [class.border-emerald-500]="form.tema === 'light'"
              [class.bg-emerald-50]="form.tema === 'light' && auth.tema() !== 'dark'"
              [class.border-gray-300]="form.tema !== 'light' && auth.tema() !== 'dark'"
              [class.bg-slate-700]="auth.tema() === 'dark' && form.tema !== 'light'"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">
              ☀️ Claro
            </button>
            <button (click)="form.tema = 'dark'"
              class="flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition"
              [class.border-emerald-500]="form.tema === 'dark'"
              [class.bg-emerald-50]="form.tema === 'dark' && auth.tema() !== 'dark'"
              [class.border-gray-300]="form.tema !== 'dark' && auth.tema() !== 'dark'"
              [class.bg-slate-700]="auth.tema() === 'dark' && form.tema !== 'dark'"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">
              🌙 Escuro
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Cor Primária</label>
            <div class="flex items-center gap-2">
              <input type="color" [(ngModel)]="form.corPrimaria" class="w-10 h-10 rounded cursor-pointer border">
              <span class="text-xs font-mono" [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">{{ form.corPrimaria }}</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Cor Secundária</label>
            <div class="flex items-center gap-2">
              <input type="color" [(ngModel)]="form.corSecundaria" class="w-10 h-10 rounded cursor-pointer border">
              <span class="text-xs font-mono" [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">{{ form.corSecundaria }}</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Cor Destaque</label>
            <div class="flex items-center gap-2">
              <input type="color" [(ngModel)]="form.corDestaque" class="w-10 h-10 rounded cursor-pointer border">
              <span class="text-xs font-mono" [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">{{ form.corDestaque }}</span>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Ícone</label>
          <div class="flex flex-wrap gap-3">
            <button *ngFor="let op of iconeOptions"
              (click)="setIcone(op.value)"
              class="flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition"
              [class.border-emerald-500]="form.icone === op.value"
              [class.bg-emerald-50]="form.icone === op.value && auth.tema() !== 'dark'"
              [class.border-gray-300]="form.icone !== op.value && auth.tema() !== 'dark'"
              [class.bg-slate-700]="auth.tema() === 'dark' && form.icone !== op.value"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#111827'">
              <span class="text-xl">{{ op.emoji }}</span>
              <span>{{ op.label }}</span>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" [style.color]="auth.tema() === 'dark' ? '#e2e8f0' : '#374151'">Dias de Antecedência para Agendamento</label>
          <div class="flex items-center gap-3">
            <input type="number" [(ngModel)]="form.diasAgenda" min="1" max="30"
              class="w-24 px-3 py-2 border rounded-lg text-sm"
              [class.bg-slate-700]="auth.tema() === 'dark'"
              [class.border-slate-600]="auth.tema() === 'dark'"
              [class.text-white]="auth.tema() === 'dark'">
            <span class="text-xs" [style.color]="auth.tema() === 'dark' ? '#94a3b8' : '#6b7280'">
              dias (1 a 30)
            </span>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button (click)="salvar()" [disabled]="salvando"
            class="flex-1 py-2.5 px-4 rounded-lg text-white font-medium text-sm transition disabled:opacity-50"
            [style.background-color]="auth.corPrimaria()">
            {{ salvando ? 'Salvando…' : 'Salvar alterações' }}
          </button>
          <button (click)="cancelar()"
            class="py-2.5 px-4 rounded-lg border text-sm font-medium transition"
            [class.border-gray-300]="auth.tema() !== 'dark'"
            [class.border-slate-600]="auth.tema() === 'dark'"
            [style.color]="auth.tema() === 'dark' ? '#f1f5f9' : '#374151'">
            Cancelar
          </button>
        </div>

        <div *ngIf="mensagem" class="text-sm font-medium" [class.text-emerald-600]="auth.tema() !== 'dark'" [class.text-emerald-400]="auth.tema() === 'dark'">{{ mensagem }}</div>
      </div>

      <div class="rounded-xl shadow-sm overflow-hidden border" [class.border-slate-700]="auth.tema() === 'dark'">
        <div class="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          [class.text-gray-500]="auth.tema() !== 'dark'"
          [class.text-gray-400]="auth.tema() === 'dark'"
          [style.background-color]="auth.tema() === 'dark' ? '#1e293b' : '#f3f4f6'">
          Pré-visualização
        </div>
        <div class="flex min-h-[200px]" [class.dark]="form.tema === 'dark'">
          <div class="w-48 p-3 flex flex-col gap-2"
            [style.background-color]="form.tema === 'dark' ? '#1e293b' : form.corPrimaria">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-6 h-6 rounded flex items-center justify-center shrink-0" style="background:rgba(255,255,255,0.2)">
                <span [innerHTML]="previewIconeSvg" class="text-white inline-block align-middle leading-none"></span>
              </div>
              <span class="text-white text-xs font-semibold truncate">{{ form.nomeFantasia || 'Minha Clínica' }}</span>
            </div>
            <div class="h-2 rounded" style="background:rgba(255,255,255,0.15);width:80%"></div>
            <div class="h-2 rounded" style="background:rgba(255,255,255,0.1);width:60%"></div>
            <div class="mt-auto pt-3" style="border-top:1px solid rgba(255,255,255,0.1)">
              <div class="h-2 rounded" style="background:rgba(255,255,255,0.1);width:40%"></div>
            </div>
          </div>
          <div class="flex-1 p-3" [style.background-color]="form.tema === 'dark' ? '#0f172a' : '#f9fafb'">
            <div class="flex items-center justify-between mb-3">
              <div class="h-3 w-32 rounded" [style.background-color]="form.tema === 'dark' ? '#334155' : '#e5e7eb'"></div>
              <div class="h-3 w-16 rounded" [style.background-color]="form.tema === 'dark' ? '#334155' : '#e5e7eb'"></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="h-16 rounded" [style.background-color]="form.tema === 'dark' ? '#334155' : '#e5e7eb'"></div>
              <div class="h-16 rounded" [style.background-color]="form.tema === 'dark' ? '#334155' : '#e5e7eb'"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfiguracaoComponent implements OnInit {
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  auth = inject(AuthService);

  form: ConfiguracaoResponse = {
    nomeFantasia: '', email: '', telefoneCelular: '', tema: 'light',
    corPrimaria: '#059669', corSecundaria: '#10b981', corDestaque: '#f59e0b',
    icone: null, diasAgenda: 2,
    documento: null, logradouro: null, numero: null, bairro: null,
    cidade: null, estado: null, cep: null,
  };
  salvando = false;
  mensagem = '';

  iconeOptions = [
    { value: 'medico', label: 'Médico', emoji: '🩺' },
    { value: 'dentista', label: 'Dentista', emoji: '🦷' },
    { value: 'fisioterapia', label: 'Fisioterapia', emoji: '💪' },
    { value: 'psicologia', label: 'Psicologia', emoji: '🧠' },
    { value: 'nutricao', label: 'Nutrição', emoji: '🥗' },
    { value: '', label: 'Geral', emoji: '🏥' },
  ];
  readonly defaultIcon = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>';

  ngOnInit() {
    this.api.getConfiguracao().subscribe({
      next: (res) => {
        this.form = { ...res };
        this.cdr.detectChanges();
      },
    });
  }

  salvar() {
    this.salvando = true;
    this.mensagem = '';
    this.api.updateConfiguracao({
      nomeFantasia: this.form.nomeFantasia,
      tema: this.form.tema,
      corPrimaria: this.form.corPrimaria,
      corSecundaria: this.form.corSecundaria,
      corDestaque: this.form.corDestaque,
      icone: this.form.icone,
      diasAgenda: this.form.diasAgenda,
    }).subscribe({
      next: (res) => {
        this.form = { ...res };
        this.auth.updateTheme(res);
        this.salvando = false;
        this.mensagem = 'Configuração salva com sucesso!';
        this.cdr.detectChanges();
      },
      error: () => {
        this.salvando = false;
        this.mensagem = 'Erro ao salvar. Tente novamente.';
        this.cdr.detectChanges();
      },
    });
  }

  cancelar() {
    this.ngOnInit();
  }

  setIcone(value: string) {
    this.form.icone = value || null;
  }

  get previewIconeSvg(): SafeHtml {
    const icons: Record<string, string> = {
      medico: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>',
      dentista: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3c-1.5 0-3 .5-4 2C7 6.5 6 10 6 13c0 2.5 1.5 5 3 5s3-2 3-3c0 1 1.5 3 3 3s3-2.5 3-5c0-3-1-6.5-2-8-1-1.5-2.5-2-4-2z"/></svg>',
      fisioterapia: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>',
      psicologia: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
      nutricao: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4"/></svg>',
    };
    const svg = icons[this.form.icone ?? ''] ?? this.defaultIcon;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
