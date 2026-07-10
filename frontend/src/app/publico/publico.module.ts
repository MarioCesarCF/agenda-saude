import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicoRoutingModule } from './publico-routing.module';
import { PublicoLayoutComponent } from './publico-layout.component';
import { AgendamentoComponent } from './agendamento.component';

@NgModule({
  declarations: [PublicoLayoutComponent, AgendamentoComponent],
  imports: [CommonModule, PublicoRoutingModule, FormsModule],
})
export class PublicoModule {}
