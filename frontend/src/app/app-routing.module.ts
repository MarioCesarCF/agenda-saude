import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
  },
  {
    path: 'p/:consultorioId',
    loadChildren: () => import('./publico/publico.module').then((m) => m.PublicoModule),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
