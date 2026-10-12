import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PacienteRoutingModule } from './paciente-routing.module';
import { ContaPacienteLoginComponent } from './conta-paciente-login.component';
import { PacienteHomeComponent } from './paciente-home.component';

@NgModule({
  declarations: [ContaPacienteLoginComponent, PacienteHomeComponent],
  imports: [CommonModule, PacienteRoutingModule, FormsModule],
})
export class PacienteModule {}