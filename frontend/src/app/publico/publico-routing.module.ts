import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicoLayoutComponent } from './publico-layout.component';
import { AgendamentoComponent } from './agendamento.component';

const routes: Routes = [
  {
    path: '',
    component: PublicoLayoutComponent,
    children: [
      { path: '', component: AgendamentoComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicoRoutingModule {}
