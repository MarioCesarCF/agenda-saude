export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  id: string;
  nome: string;
  email: string;
  perfil: string;
  consultorioId: string;
  nomeFantasia: string;
  tema: string;
  corPrimaria: string;
  corSecundaria: string;
  corDestaque: string;
  icone?: string;
  diasAgenda: number;
}

export interface CadastroConsultorioRequest {
  nomeFantasia: string;
  email: string;
  telefoneCelular: string;
  senha: string;
  documento?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tema?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  corDestaque?: string;
  icone?: string;
}

export interface ConfiguracaoResponse {
  nomeFantasia: string;
  email: string;
  documento: string | null;
  telefoneCelular: string;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  tema: string;
  corPrimaria: string;
  corSecundaria: string;
  corDestaque: string;
  icone: string | null;
  diasAgenda: number;
}

export interface ConfiguracaoUpdateRequest {
  nomeFantasia?: string;
  tema?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  corDestaque?: string;
  icone?: string | null;
  diasAgenda?: number;
}

export interface CadastroPacienteRequest {
  nome: string;
  email: string;
  telefoneCelular: string;
  senha: string;
}

export interface Profissional {
  id: string;
  nome: string;
  telefoneCelular?: string;
  email?: string;
  especialidade?: string;
  registroProfissional?: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  duracaoMinutos: number;
  preco: number;
  cor?: string;
  semProfissional: boolean;
}

export interface Agendamento {
  id: string;
  profissionalId?: string;
  profissionalNome: string;
  servicoId: string;
  servicoNome: string;
  servicoPreco: number;
  pacienteId: string;
  pacienteNome: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  status: string;
  dataCriacao: string;
}

export interface HorariosDisponiveis {
  data: string;
  horarios: string[];
}

export interface ProfissionalServico {
  profissionalId: string;
  servicoId: string;
}

export interface HorarioDisponivel {
  id: string;
  profissionalId?: string;
  profissionalNome?: string;
  servicoId?: string;
  servicoNome?: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  dataCadastro: string;
}

export interface CriarUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  perfil: string;
}

export interface AtualizarUsuarioRequest {
  nome: string;
  email: string;
  perfil?: string;
}

export interface AtualizarPerfilRequest {
  nome: string;
  email: string;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}
