import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { App } from './app';
import { AppRoutingModule } from './app-routing.module';
import { authInterceptor } from './interceptors/auth.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';

@NgModule({
  declarations: [App],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
