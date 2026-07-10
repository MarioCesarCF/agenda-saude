import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiService } from '../services/api.service';
import type { ConfiguracaoResponse } from '../models/models';

@Component({
  selector: 'app-publico-layout',
  template: `
    <div class="min-h-screen" [class.dark]="config?.tema === 'dark'" [style.backgroundColor]="config?.tema === 'dark' ? '#0f172a' : '#f9fafb'">
      @if (configLoaded) {
      <header class="sticky top-0 z-10 px-4 py-3"
        [style.backgroundColor]="config?.tema === 'dark' ? '#0f172a' : config!.corPrimaria"
        [style.borderBottom]="config?.tema === 'dark' ? '1px solid #1e293b' : 'none'">
        <div class="max-w-lg mx-auto flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background:rgba(255,255,255,0.2)">
            <span [innerHTML]="iconeSvg" class="w-5 h-5 text-white inline-block align-middle leading-none"></span>
          </div>
          <div>
            <h1 class="font-semibold text-sm text-white leading-tight">{{ config!.nomeFantasia }}</h1>
            <p class="text-xs leading-tight mt-0.5" [style.color]="config?.tema === 'dark' ? '#94a3b8' : 'rgba(255,255,255,0.7)'">
              Agende sua consulta
            </p>
          </div>
        </div>
      </header>
      }
      <main class="max-w-lg mx-auto p-4">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  standalone: false,
})
export class PublicoLayoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  consultorioId = '';
  config: ConfiguracaoResponse | null = null;
  configLoaded = false;

  ngOnInit() {
    this.consultorioId = this.route.snapshot.params['consultorioId'];
    this.api.getConfiguracaoPublica(this.consultorioId).subscribe({
      next: (res) => {
        this.config = res;
        this.configLoaded = true;
      },
    });
  }

  get iconeSvg() {
    const icone = this.config?.icone;
    const icons: Record<string, string> = {
      medico: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>`,
      dentista: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3c-1.5 0-3 .5-4 2C7 6.5 6 10 6 13c0 2.5 1.5 5 3 5s3-2 3-3c0 1 1.5 3 3 3s3-2.5 3-5c0-3-1-6.5-2-8-1-1.5-2.5-2-4-2z"/></svg>`,
      fisioterapia: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>`,
      psicologia: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>`,
      nutricao: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4"/></svg>`,
    };
    const svg = icons[icone ?? ''] ?? `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
