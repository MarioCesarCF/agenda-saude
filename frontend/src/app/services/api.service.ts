import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from './auth.service';
import type {
  Profissional,
  Servico,
  Agendamento,
  HorariosDisponiveis,
  ConfiguracaoResponse,
  ConfiguracaoUpdateRequest,
  ProfissionalServico,
  HorarioDisponivel,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:5268/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  getProfissionais() {
    return this.http.get<Profissional[]>(`${this.baseUrl}/cadastros/profissionais`);
  }

  createProfissional(data: any) {
    return this.http.post<Profissional>(`${this.baseUrl}/cadastros/profissionais`, data);
  }

  updateProfissional(id: string, data: any) {
    return this.http.put<Profissional>(`${this.baseUrl}/cadastros/profissionais/${id}`, data);
  }

  deleteProfissional(id: string) {
    return this.http.delete(`${this.baseUrl}/cadastros/profissionais/${id}`);
  }

  getServicos() {
    return this.http.get<Servico[]>(`${this.baseUrl}/cadastros/servicos`);
  }

  createServico(data: any) {
    return this.http.post<Servico>(`${this.baseUrl}/cadastros/servicos`, data);
  }

  updateServico(id: string, data: any) {
    return this.http.put<Servico>(`${this.baseUrl}/cadastros/servicos/${id}`, data);
  }

  deleteServico(id: string) {
    return this.http.delete(`${this.baseUrl}/cadastros/servicos/${id}`);
  }

  getAgendamentos(data?: string, profissionalId?: string) {
    let params = new HttpParams();
    if (data) params = params.set('data', data);
    if (profissionalId) params = params.set('profissionalId', profissionalId);
    return this.http.get<Agendamento[]>(`${this.baseUrl}/agendamento`, { params });
  }

  createAgendamentoAdmin(data: any) {
    return this.http.post<Agendamento>(`${this.baseUrl}/agendamento/admin`, data);
  }

  cancelarAgendamento(id: string) {
    return this.http.patch(`${this.baseUrl}/agendamento/${id}/cancelar`, {});
  }

  atualizarStatusAgendamento(id: string, status: string) {
    return this.http.patch(`${this.baseUrl}/agendamento/${id}/status`, { status });
  }

  createPacienteAdmin(data: any) {
    return this.http.post(`${this.baseUrl}/cadastros/pacientes`, data);
  }

  createHorario(data: any) {
    return this.http.post(`${this.baseUrl}/cadastros/horarios`, data);
  }

  getHorarios() {
    return this.http.get<HorarioDisponivel[]>(`${this.baseUrl}/cadastros/horarios`);
  }

  deleteHorario(id: string) {
    return this.http.delete(`${this.baseUrl}/cadastros/horarios/${id}`);
  }

  createBloqueio(data: any) {
    return this.http.post(`${this.baseUrl}/cadastros/bloqueios`, data);
  }

  getProfissionaisPublico(consultorioId: string, servicoId?: string) {
    let params = new HttpParams();
    if (servicoId) params = params.set('servicoId', servicoId);
    return this.http.get<Profissional[]>(
      `${this.baseUrl}/publico/${consultorioId}/profissionais`,
      { params },
    );
  }

  getServicosPublico(consultorioId: string, profissionalId?: string) {
    let params = new HttpParams();
    if (profissionalId) params = params.set('profissionalId', profissionalId);
    return this.http.get<Servico[]>(`${this.baseUrl}/publico/${consultorioId}/servicos`, { params });
  }

  getHorariosDisponiveis(
    consultorioId: string,
    profissionalId?: string,
    servicoId?: string,
    dataInicio?: string,
    dataFim?: string,
  ) {
    let params = new HttpParams();
    if (profissionalId) params = params.set('profissionalId', profissionalId);
    if (servicoId) params = params.set('servicoId', servicoId);
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    return this.http.get<HorariosDisponiveis[]>(
      `${this.baseUrl}/publico/${consultorioId}/horarios-disponiveis`,
      { params },
    );
  }

  agendarPublico(consultorioId: string, data: any) {
    return this.http.post<Agendamento>(
      `${this.baseUrl}/publico/${consultorioId}/agendar`,
      data,
    );
  }

  getConfiguracao() {
    return this.http.get<ConfiguracaoResponse>(`${this.baseUrl}/cadastros/configuracao`);
  }

  updateConfiguracao(data: ConfiguracaoUpdateRequest) {
    return this.http.put<ConfiguracaoResponse>(`${this.baseUrl}/cadastros/configuracao`, data);
  }

  getConfiguracaoPublica(consultorioId: string) {
    return this.http.get<ConfiguracaoResponse>(
      `${this.baseUrl}/publico/${consultorioId}/configuracao`,
    );
  }

  getVinculos() {
    return this.http.get<ProfissionalServico[]>(`${this.baseUrl}/cadastros/vinculos`);
  }

  vincularServico(data: { profissionalId: string; servicoId: string }) {
    return this.http.post(`${this.baseUrl}/cadastros/vinculos`, data);
  }

  desvincularServico(data: { profissionalId: string; servicoId: string }) {
    return this.http.delete(`${this.baseUrl}/cadastros/vinculos`, { body: data });
  }
}
