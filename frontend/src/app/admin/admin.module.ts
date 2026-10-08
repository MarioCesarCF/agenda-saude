import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { LoginComponent } from './login.component';
import { AdminLayoutComponent } from './admin-layout.component';
import { DashboardComponent } from './dashboard.component';
import { ProfissionaisComponent } from './profissionais.component';
import { ServicosComponent } from './servicos.component';
import { ConfiguracaoComponent } from './configuracao.component';
import { HorariosComponent } from './horarios.component';
import { UsuariosComponent } from './usuarios.component';
import { PerfilComponent } from './perfil.component';
import { EsqueciSenhaComponent } from './esqueci-senha.component';
import { ResetarSenhaComponent } from './resetar-senha.component';

@NgModule({
  declarations: [
    LoginComponent,
    AdminLayoutComponent,
    DashboardComponent,
    ProfissionaisComponent,
    ServicosComponent,
    ConfiguracaoComponent,
    HorariosComponent,
    UsuariosComponent,
    PerfilComponent,
    EsqueciSenhaComponent,
    ResetarSenhaComponent,
  ],
  imports: [CommonModule, AdminRoutingModule, FormsModule, ReactiveFormsModule],
})
export class AdminModule {}
