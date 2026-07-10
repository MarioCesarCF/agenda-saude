import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { AdminLayoutComponent } from './admin-layout.component';
import { DashboardComponent } from './dashboard.component';
import { ProfissionaisComponent } from './profissionais.component';
import { ServicosComponent } from './servicos.component';
import { ConfiguracaoComponent } from './configuracao.component';
import { HorariosComponent } from './horarios.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'dashboard',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'profissionais', component: ProfissionaisComponent },
      { path: 'servicos', component: ServicosComponent },
      { path: 'horarios', component: HorariosComponent },
      { path: 'configuracao', component: ConfiguracaoComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
