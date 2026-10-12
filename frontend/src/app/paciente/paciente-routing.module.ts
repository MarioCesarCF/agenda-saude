import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContaPacienteLoginComponent } from './conta-paciente-login.component';
import { PacienteHomeComponent } from './paciente-home.component';
import { ContaPacienteGuard } from '../guards/conta-paciente.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [ContaPacienteGuard],
    component: PacienteHomeComponent,
  },
  {
    path: 'entrar',
    component: ContaPacienteLoginComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PacienteRoutingModule {}