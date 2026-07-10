import { Component, inject } from '@angular/core';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  template: `
    @if (loading.loading()) {
    <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <span class="text-sm text-gray-500">Carregando…</span>
      </div>
    </div>
    }
    <router-outlet></router-outlet>
  `,
  standalone: false,
})
export class App {
  loading = inject(LoadingService);
}
