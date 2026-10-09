import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicoLayoutComponent } from './publico-layout.component';
import { AgendamentoComponent } from './agendamento.component';
import { PacienteLoginComponent } from './paciente-login.component';
import { MinhaAgendaComponent } from './minha-agenda.component';
import { PacienteGuard } from '../guards/paciente.guard';

const routes: Routes = [
  {
    path: '',
    component: PublicoLayoutComponent,
    children: [
      { path: '', component: AgendamentoComponent },
      { path: 'entrar', component: PacienteLoginComponent },
      { path: 'minha-agenda', component: MinhaAgendaComponent, canActivate: [PacienteGuard] },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicoRoutingModule {}
