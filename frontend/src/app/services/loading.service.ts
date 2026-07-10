import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  readonly loading = signal(false);

  start() {
    this.count++;
    this.loading.set(true);
  }

  stop() {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) this.loading.set(false);
  }
}
