import { Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  template: `
    <div class="min-h-screen flex" [class.dark]="auth.tema() === 'dark'">
      <aside
        class="w-64 flex flex-col"
        [style.backgroundColor]="auth.tema() === 'dark' ? '#1e293b' : auth.corPrimaria()"
      >
        <div class="p-4 border-b" [style.borderColor]="auth.tema() === 'dark' ? '#334155' : 'rgba(255,255,255,0.15)'">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:rgba(255,255,255,0.2)">
              <span [innerHTML]="iconeSvg" class="w-5 h-5 text-white inline-block align-middle leading-none"></span>
            </div>
            <div>
              <h2 class="font-bold text-sm text-white leading-tight">{{ auth.nomeFantasia() }}</h2>
              <p class="text-xs leading-tight mt-0.5" [style.color]="auth.tema() === 'dark' ? '#94a3b8' : 'rgba(255,255,255,0.7)'">{{ auth.nome() }}</p>
            </div>
          </div>
        </div>
        <nav class="flex-1 p-2 space-y-1">
          <a routerLink="/admin/dashboard" #r1="routerLinkActive" routerLinkActive [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition"
            [style.color]="r1.isActive ? '#fff' : 'rgba(255,255,255,0.75)'"
            [style.backgroundColor]="r1.isActive ? 'rgba(255,255,255,0.15)' : 'transparent'"
            (mouseenter)="!r1.isActive && $any($event.target).style.setProperty('background-color', 'rgba(255,255,255,0.08)')"
            (mouseleave)="!r1.isActive && $any($event.target).style.setProperty('background-color', 'transparent')">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Agenda
          </a>
          <a routerLink="/admin/dashboard/profissionais" #r2="routerLinkActive" routerLinkActive
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition"
            [style.color]="r2.isActive ? '#fff' : 'rgba(255,255,255,0.75)'"
            [style.backgroundColor]="r2.isActive ? 'rgba(255,255,255,0.15)' : 'transparent'"
            (mouseenter)="!r2.isActive && $any($event.target).style.setProperty('background-color', 'rgba(255,255,255,0.08)')"
            (mouseleave)="!r2.isActive && $any($event.target).style.setProperty('background-color', 'transparent')">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            Profissionais
          </a>
          <a routerLink="/admin/dashboard/servicos" #r3="routerLinkActive" routerLinkActive
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition"
            [style.color]="r3.isActive ? '#fff' : 'rgba(255,255,255,0.75)'"
            [style.backgroundColor]="r3.isActive ? 'rgba(255,255,255,0.15)' : 'transparent'"
            (mouseenter)="!r3.isActive && $any($event.target).style.setProperty('background-color', 'rgba(255,255,255,0.08)')"
            (mouseleave)="!r3.isActive && $any($event.target).style.setProperty('background-color', 'transparent')">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
            Serviços
          </a>
          <a routerLink="/admin/dashboard/horarios" #r5="routerLinkActive" routerLinkActive
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition"
            [style.color]="r5.isActive ? '#fff' : 'rgba(255,255,255,0.75)'"
            [style.backgroundColor]="r5.isActive ? 'rgba(255,255,255,0.15)' : 'transparent'"
            (mouseenter)="!r5.isActive && $any($event.target).style.setProperty('background-color', 'rgba(255,255,255,0.08)')"
            (mouseleave)="!r5.isActive && $any($event.target).style.setProperty('background-color', 'transparent')">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Horários
          </a>
          @if (auth.isAdmin()) {
          <a routerLink="/admin/dashboard/usuarios" #r6="routerLinkActive" routerLinkActive
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition"
            [style.color]="r6.isActive ? '#fff' : 'rgba(255,255,255,0.75)'"
            [style.backgroundColor]="r6.isActive ? 'rgba(255,255,255,0.15)' : 'transparent'"
            (mouseenter)="!r6.isActive && $any($event.target).style.setProperty('background-color', 'rgba(255,255,255,0.08)')"
            (mouseleave)="!r6.isActive && $any($event.target).style.setProperty('background-color', 'transparent')">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Usuários
          </a>
          <a routerLink="/admin/dashboard/configuracao" #r4="routerLinkActive" routerLinkActive
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition"
            [style.color]="r4.isActive ? '#fff' : 'rgba(255,255,255,0.75)'"
            [style.backgroundColor]="r4.isActive ? 'rgba(255,255,255,0.15)' : 'transparent'"
            (mouseenter)="!r4.isActive && $any($event.target).style.setProperty('background-color', 'rgba(255,255,255,0.08)')"
            (mouseleave)="!r4.isActive && $any($event.target).style.setProperty('background-color', 'transparent')">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Configuração
          </a>
          }
          <a routerLink="/admin/dashboard/perfil" #r7="routerLinkActive" routerLinkActive
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition"
            [style.color]="r7.isActive ? '#fff' : 'rgba(255,255,255,0.75)'"
            [style.backgroundColor]="r7.isActive ? 'rgba(255,255,255,0.15)' : 'transparent'"
            (mouseenter)="!r7.isActive && $any($event.target).style.setProperty('background-color', 'rgba(255,255,255,0.08)')"
            (mouseleave)="!r7.isActive && $any($event.target).style.setProperty('background-color', 'transparent')">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Meu Perfil
          </a>
        </nav>
        <div class="p-4" [style.borderTop]="'1px solid ' + (auth.tema() === 'dark' ? '#334155' : 'rgba(255,255,255,0.15)')">
          <button (click)="auth.logout()"
            class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition text-white/75 hover:text-white"
            style="background:rgba(255,255,255,0.05)"
            (mouseenter)="$any($event.target).style.background='rgba(255,255,255,0.12)'"
            (mouseleave)="$any($event.target).style.background='rgba(255,255,255,0.05)'">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sair
          </button>
        </div>
      </aside>
      <main class="flex-1 p-6 overflow-auto" [style.backgroundColor]="auth.tema() === 'dark' ? '#0f172a' : '#f9fafb'">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  standalone: false,
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  get iconeSvg() {
    const icone = this.auth.icone();
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
