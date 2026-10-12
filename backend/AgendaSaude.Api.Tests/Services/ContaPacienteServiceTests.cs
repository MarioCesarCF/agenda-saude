using AgendaSaude.Api.Data;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;
using AgendaSaude.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace AgendaSaude.Api.Tests.Services;

public class ContaPacienteServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ContaPacienteService _service;
    private readonly TokenService _tokenService;
    private const string JwtKey = "test-key-for-conta-paciente-tests-32chars";

    public ContaPacienteServiceTests()
    {
        _context = TestHelper.CreateInMemoryContext();
        _tokenService = new TokenService(JwtKey, "Test", "Test");
        _service = new ContaPacienteService(_context, _tokenService, new RefreshTokenService(_context));
    }

    public void Dispose() => _context.Dispose();

    private async Task<Consultorio> CriarConsultorioAsync(string nome = "Clínica Teste", string email = "c@test.com")
    {
        var consultorio = new Consultorio
        {
            NomeFantasia = nome,
            Email = email,
            TelefoneCelular = "11999999999",
            Slug = SlugHelper.Gerar(nome)
        };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();
        return consultorio;
    }

    private async Task<Paciente> CriarPacienteAsync(Guid consultorioId, string email, string nome = "João")
    {
        var paciente = new Paciente
        {
            ConsultorioId = consultorioId,
            Nome = nome,
            Email = email,
            TelefoneCelular = "11988888888"
        };
        _context.Pacientes.Add(paciente);
        await _context.SaveChangesAsync();
        return paciente;
    }

    private async Task<Servico> CriarServicoAsync(Guid consultorioId)
    {
        var servico = new Servico
        {
            ConsultorioId = consultorioId,
            Nome = "Consulta",
            Preco = 150m,
            DuracaoMinutos = 30
        };
        _context.Servicos.Add(servico);
        await _context.SaveChangesAsync();
        return servico;
    }

    private async Task<Agendamento> CriarAgendamentoAsync(
        Guid consultorioId, Guid pacienteId, Guid servicoId, DateTime inicio)
    {
        var agendamento = new Agendamento
        {
            ConsultorioId = consultorioId,
            PacienteId = pacienteId,
            ServicoId = servicoId,
            DataHoraInicio = inicio,
            DataHoraFim = inicio.AddMinutes(30)
        };
        _context.Agendamentos.Add(agendamento);
        await _context.SaveChangesAsync();
        return agendamento;
    }

    private CadastroContaPacienteRequest RequestCadastro(string email = "paciente@test.com", string senha = "senha123")
        => new("Maria Paciente", email, "11977777777", senha);

    // ── CadastrarAsync ──

    [Fact]
    public async Task Cadastrar_DeveCriarContaERetornarToken()
    {
        var (resposta, emailEmUso) = await _service.CadastrarAsync(RequestCadastro());

        Assert.False(emailEmUso);
        Assert.NotNull(resposta);
        Assert.False(string.IsNullOrWhiteSpace(resposta!.Token));
        Assert.False(string.IsNullOrWhiteSpace(resposta.RefreshToken));
        Assert.Equal("Maria Paciente", resposta.Nome);
        Assert.Equal("paciente@test.com", resposta.Email);

        var conta = await _context.ContasPacientes.FirstAsync(c => c.Email == "paciente@test.com");
        Assert.True(BCrypt.Net.BCrypt.Verify("senha123", conta.SenhaHash));
        Assert.True(await _context.RefreshTokens.AnyAsync(t => t.ContaPacienteId == conta.Id));
    }

    [Fact]
    public async Task Cadastrar_DeveVincularPacientesOrfaosPeloEmail()
    {
        var consultorio = await CriarConsultorioAsync();
        var paciente = await CriarPacienteAsync(consultorio.Id, "PACIENTE@test.com");

        var (resposta, _) = await _service.CadastrarAsync(RequestCadastro());

        Assert.NotNull(resposta);
        var atualizado = await _context.Pacientes.FirstAsync(p => p.Id == paciente.Id);
        Assert.Equal(new Guid(resposta!.Id), atualizado.ContaPacienteId);
    }

    [Fact]
    public async Task Cadastrar_EmailDuplicado_DeveRetornarEmailEmUso()
    {
        await _service.CadastrarAsync(RequestCadastro());

        var (resposta, emailEmUso) = await _service.CadastrarAsync(
            new CadastroContaPacienteRequest("Outra", "paciente@test.com", "11966666666", "outrasenha"));

        Assert.Null(resposta);
        Assert.True(emailEmUso);
        Assert.Equal(1, await _context.ContasPacientes.CountAsync());
    }

    // ── LoginAsync ──

    [Fact]
    public async Task Login_DeveVincularPacientesEVincularNovoRefresh()
    {
        var consultorio = await CriarConsultorioAsync();
        await CriarPacienteAsync(consultorio.Id, "paciente@test.com");
        await _service.CadastrarAsync(RequestCadastro());

        var result = await _service.LoginAsync(new LoginContaPacienteRequest("paciente@test.com", "senha123"));

        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result!.RefreshToken));

        var paciente = await _context.Pacientes.FirstAsync(p => p.ConsultorioId == consultorio.Id);
        Assert.Equal(new Guid(result.Id), paciente.ContaPacienteId);

        var tokens = await _context.RefreshTokens
            .Where(t => t.ContaPacienteId == new Guid(result.Id))
            .ToListAsync();
        Assert.Equal(2, tokens.Count);
    }

    [Fact]
    public async Task Login_SenhaErrada_DeveRetornarNull()
    {
        await _service.CadastrarAsync(RequestCadastro());

        var result = await _service.LoginAsync(new LoginContaPacienteRequest("paciente@test.com", "senhaerrada"));

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_ContaInativa_DeveRetornarNull()
    {
        await _service.CadastrarAsync(RequestCadastro());

        var conta = await _context.ContasPacientes.FirstAsync();
        conta.Ativo = false;
        await _context.SaveChangesAsync();

        var result = await _service.LoginAsync(new LoginContaPacienteRequest("paciente@test.com", "senha123"));

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_ContaSemSenha_DeveRetornarNull()
    {
        _context.ContasPacientes.Add(new ContaPaciente { Nome = "Maria", Email = "sem-senha@test.com" });
        await _context.SaveChangesAsync();

        var result = await _service.LoginAsync(new LoginContaPacienteRequest("sem-senha@test.com", "qualquer"));

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_EmailInexistente_DeveRetornarNull()
    {
        var result = await _service.LoginAsync(new LoginContaPacienteRequest("naoexiste@test.com", "senha123"));

        Assert.Null(result);
    }

    // ── RefreshAsync ──

    [Fact]
    public async Task Refresh_DeveRotacionarRefreshToken()
    {
        var (resposta, _) = await _service.CadastrarAsync(RequestCadastro());

        var result = await _service.RefreshAsync(resposta!.RefreshToken);

        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result!.RefreshToken));
        Assert.Equal(resposta.Id, result.Id);

        var tentarUsarNovamente = await _service.RefreshAsync(resposta.RefreshToken);
        Assert.Null(tentarUsarNovamente);
    }

    [Fact]
    public async Task Refresh_TokenInvalido_DeveRetornarNull()
    {
        var result = await _service.RefreshAsync("token-invalido");

        Assert.Null(result);
    }

    // ── ObterPerfilAsync ──

    [Fact]
    public async Task ObterPerfil_DeveRetornarDadosSemNovoRefresh()
    {
        var (resposta, _) = await _service.CadastrarAsync(RequestCadastro());

        var perfil = await _service.ObterPerfilAsync(new Guid(resposta!.Id));

        Assert.NotNull(perfil);
        Assert.Equal("Maria Paciente", perfil!.Nome);
        Assert.Equal("paciente@test.com", perfil.Email);
        Assert.Equal(string.Empty, perfil.RefreshToken);
    }

    // ── ListarAgendamentosAsync ──

    [Fact]
    public async Task ListarAgendamentos_DeveAgregarConsultoriosDoPaciente()
    {
        var c1 = await CriarConsultorioAsync("Clínica 1", "c1@test.com");
        var c2 = await CriarConsultorioAsync("Clínica 2", "c2@test.com");
        var paciente1 = await CriarPacienteAsync(c1.Id, "paciente@test.com");
        var paciente2 = await CriarPacienteAsync(c2.Id, "paciente@test.com");
        var servico1 = await CriarServicoAsync(c1.Id);
        var servico2 = await CriarServicoAsync(c2.Id);

        var agora = DateTime.UtcNow.AddDays(1).Date;
        await CriarAgendamentoAsync(c1.Id, paciente1.Id, servico1.Id, agora.AddHours(10));
        await CriarAgendamentoAsync(c2.Id, paciente2.Id, servico2.Id, agora.AddHours(11));

        var (resposta, _) = await _service.CadastrarAsync(RequestCadastro());

        var agendamentos = await _service.ListarAgendamentosAsync(new Guid(resposta!.Id));

        Assert.Equal(2, agendamentos.Count);
        Assert.Contains(agendamentos, a => a.ConsultorioNome == "Clínica 1");
        Assert.Contains(agendamentos, a => a.ConsultorioNome == "Clínica 2");
        Assert.True(agendamentos[0].DataHoraInicio >= agendamentos[1].DataHoraInicio);
        Assert.Equal("Clínica 2", agendamentos[0].ConsultorioNome);
        Assert.All(agendamentos, a => Assert.False(string.IsNullOrWhiteSpace(a.ConsultorioSlug)));

        var paciente1Atualizado = await _context.Pacientes.FirstAsync(p => p.Id == paciente1.Id);
        var paciente2Atualizado = await _context.Pacientes.FirstAsync(p => p.Id == paciente2.Id);
        Assert.Equal(new Guid(resposta.Id), paciente1Atualizado.ContaPacienteId);
        Assert.Equal(new Guid(resposta.Id), paciente2Atualizado.ContaPacienteId);
    }

    [Fact]
    public async Task ListarAgendamentos_SemVincularPacientes_DeveRetornarListaVazia()
    {
        var result = await _service.ListarAgendamentosAsync(Guid.NewGuid());

        Assert.Empty(result);
    }

    // ── CancelarAgendamentoAsync ──

    [Fact]
    public async Task Cancelar_DeveCancelarAgendamentoDoPacienteELogarAcao()
    {
        var consultorio = await CriarConsultorioAsync();
        var paciente = await CriarPacienteAsync(consultorio.Id, "paciente@test.com");
        var servico = await CriarServicoAsync(consultorio.Id);
        var agendamento = await CriarAgendamentoAsync(
            consultorio.Id, paciente.Id, servico.Id, DateTime.UtcNow.AddDays(2));

        var (resposta, _) = await _service.CadastrarAsync(RequestCadastro());

        var cancelou = await _service.CancelarAgendamentoAsync(new Guid(resposta!.Id), agendamento.Id);

        Assert.True(cancelou);
        var atualizado = await _context.Agendamentos.FirstAsync(a => a.Id == agendamento.Id);
        Assert.Equal(StatusAgendamento.Cancelado, atualizado.Status);

        var historico = await _context.HistoricoAcoes.FirstAsync(h => h.Acao == "CancelarAgendamentoPaciente");
        Assert.Equal(consultorio.Id, historico.ConsultorioId);
        Assert.Null(historico.UsuarioId);
        Assert.Equal(agendamento.Id.ToString(), historico.EntidadeId);
    }

    [Fact]
    public async Task Cancelar_AgendamentoDeOutroPaciente_DeveRetornarFalse()
    {
        var consultorio = await CriarConsultorioAsync();
        var paciente = await CriarPacienteAsync(consultorio.Id, "paciente@test.com");
        var outro = await CriarPacienteAsync(consultorio.Id, "outro@test.com");
        var servico = await CriarServicoAsync(consultorio.Id);
        var agendamento = await CriarAgendamentoAsync(
            consultorio.Id, outro.Id, servico.Id, DateTime.UtcNow.AddDays(2));

        var (resposta, _) = await _service.CadastrarAsync(RequestCadastro());

        var cancelou = await _service.CancelarAgendamentoAsync(new Guid(resposta!.Id), agendamento.Id);

        Assert.False(cancelou);
        var atualizado = await _context.Agendamentos.FirstAsync(a => a.Id == agendamento.Id);
        Assert.Equal(StatusAgendamento.Agendado, atualizado.Status);
    }

    // ── ReagendarAgendamentoAsync ──

    private async Task<(ContaPacienteLoginResponse Resposta, Agendamento Agendamento)> CriarCenarioReagendarAsync()
    {
        var consultorio = await CriarConsultorioAsync();
        var paciente = await CriarPacienteAsync(consultorio.Id, "paciente@test.com");
        var servico = await CriarServicoAsync(consultorio.Id);
        var agendamento = await CriarAgendamentoAsync(
            consultorio.Id, paciente.Id, servico.Id, DateTime.UtcNow.AddDays(3).Date.AddHours(10));

        var (resposta, _) = await _service.CadastrarAsync(RequestCadastro());
        return (resposta!, agendamento);
    }

    [Fact]
    public async Task Reagendar_DeveRedefinirDataELogarAcao()
    {
        var (resposta, agendamento) = await CriarCenarioReagendarAsync();
        var novaData = DateTime.UtcNow.AddDays(4).Date.AddHours(15);

        var result = await _service.ReagendarAgendamentoAsync(new Guid(resposta.Id), agendamento.Id, novaData);

        Assert.NotNull(result);
        Assert.Equal(novaData, result!.DataHoraInicio);
        Assert.Equal(novaData.AddMinutes(30), result.DataHoraFim);

        var historico = await _context.HistoricoAcoes.FirstAsync(h => h.Acao == "ReagendarAgendamentoPaciente");
        Assert.Equal(agendamento.Id.ToString(), historico.EntidadeId);
        Assert.Null(historico.UsuarioId);
    }

    [Fact]
    public async Task Reagendar_ConflitoDeHorario_DeveRetornarNull()
    {
        var (resposta, agendamento) = await CriarCenarioReagendarAsync();

        var servico = await _context.Servicos.FirstAsync(s => s.Id == agendamento.ServicoId);
        var pessoa = new Profissional { ConsultorioId = agendamento.ConsultorioId, Nome = "Dr. A", TelefoneCelular = "11999999999" };
        _context.Profissionais.Add(pessoa);
        await _context.SaveChangesAsync();

        agendamento.ProfissionalId = pessoa.Id;
        await _context.SaveChangesAsync();

        var outro = await _context.Agendamentos.AddAsync(new Agendamento
        {
            ConsultorioId = agendamento.ConsultorioId,
            ProfissionalId = pessoa.Id,
            ServicoId = agendamento.ServicoId,
            PacienteId = agendamento.PacienteId,
            DataHoraInicio = DateTime.UtcNow.AddDays(4).Date.AddHours(10),
            DataHoraFim = DateTime.UtcNow.AddDays(4).Date.AddHours(10).AddMinutes(servico.DuracaoMinutos)
        });
        await _context.SaveChangesAsync();

        var resultado = await _service.ReagendarAgendamentoAsync(
            new Guid(resposta.Id), agendamento.Id, DateTime.UtcNow.AddDays(4).Date.AddHours(10));

        Assert.Null(resultado);
    }

    [Fact]
    public async Task Reagendar_StatusCancelado_DeveRetornarNull()
    {
        var (resposta, agendamento) = await CriarCenarioReagendarAsync();

        agendamento.Status = StatusAgendamento.Cancelado;
        await _context.SaveChangesAsync();

        var result = await _service.ReagendarAgendamentoAsync(
            new Guid(resposta.Id), agendamento.Id, DateTime.UtcNow.AddDays(4).Date.AddHours(15));

        Assert.Null(result);
    }

    [Fact]
    public async Task Reagendar_AgendamentoDeOutroPaciente_DeveRetornarNull()
    {
        var consultorio = await CriarConsultorioAsync();
        var outro = await CriarPacienteAsync(consultorio.Id, "outro@test.com");
        var servico = await CriarServicoAsync(consultorio.Id);
        var agendamento = await CriarAgendamentoAsync(
            consultorio.Id, outro.Id, servico.Id, DateTime.UtcNow.AddDays(3).Date.AddHours(10));

        var (resposta, _) = await _service.CadastrarAsync(RequestCadastro());

        var result = await _service.ReagendarAgendamentoAsync(
            new Guid(resposta!.Id), agendamento.Id, DateTime.UtcNow.AddDays(5).Date.AddHours(15));

        Assert.Null(result);
    }
}