using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/publico/{consultorio}")]
[EnableRateLimiting("publico")]
public class PublicoController : ControllerBase
{
    private readonly CadastroService _cadastroService;
    private readonly AgendamentoService _agendamentoService;
    private readonly ConsultorioResolver _consultorioResolver;

    public PublicoController(
        CadastroService cadastroService,
        AgendamentoService agendamentoService,
        ConsultorioResolver consultorioResolver)
    {
        _cadastroService = cadastroService;
        _agendamentoService = agendamentoService;
        _consultorioResolver = consultorioResolver;
    }

    [HttpGet("profissionais")]
    public async Task<IActionResult> ListarProfissionais(
        string consultorio, [FromQuery] Guid? servicoId = null)
    {
        var consultorioId = await _consultorioResolver.ResolverIdAsync(consultorio);
        if (consultorioId is null) return NotFound(new { erro = "Consultório não encontrado" });

        var result = await _cadastroService.ListarProfissionaisAsync(consultorioId.Value, servicoId);
        return Ok(result);
    }

    [HttpGet("servicos")]
    public async Task<IActionResult> ListarServicos(
        string consultorio, [FromQuery] Guid? profissionalId = null)
    {
        var consultorioId = await _consultorioResolver.ResolverIdAsync(consultorio);
        if (consultorioId is null) return NotFound(new { erro = "Consultório não encontrado" });

        var result = await _cadastroService.ListarServicosAsync(consultorioId.Value, profissionalId);
        return Ok(result);
    }

    [HttpGet("horarios-disponiveis")]
    public async Task<IActionResult> HorariosDisponiveis(
        string consultorio, [FromQuery] Guid? profissionalId,
        [FromQuery] Guid? servicoId = null,
        [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
    {
        var consultorioId = await _consultorioResolver.ResolverIdAsync(consultorio);
        if (consultorioId is null) return NotFound(new { erro = "Consultório não encontrado" });

        var inicio = dataInicio ?? DateTime.Today;
        var fim = dataFim ?? DateTime.Today.AddDays(14);

        if (profissionalId.HasValue)
        {
            var result = await _agendamentoService.ObterHorariosDisponiveisAsync(
                consultorioId.Value, profissionalId.Value, servicoId, inicio, fim);
            return Ok(result);
        }

        if (servicoId.HasValue)
        {
            var result = await _agendamentoService.ObterHorariosDisponiveisSemProfissionalAsync(
                consultorioId.Value, servicoId.Value, inicio, fim);
            return Ok(result);
        }

        return BadRequest(new { erro = "profissionalId ou servicoId é obrigatório" });
    }

    [HttpGet("configuracao")]
    public async Task<IActionResult> ObterConfiguracao(string consultorio)
    {
        var consultorioId = await _consultorioResolver.ResolverIdAsync(consultorio);
        if (consultorioId is null) return NotFound(new { erro = "Consultório não encontrado" });

        var result = await _cadastroService.ObterConfiguracaoPublicaAsync(consultorioId.Value);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPost("agendar")]
    public async Task<IActionResult> Agendar(
        string consultorio, [FromBody] AgendamentoPublicoRequest request)
    {
        var consultorioId = await _consultorioResolver.ResolverIdAsync(consultorio);
        if (consultorioId is null)
            return NotFound(new { erro = "Consultório não encontrado" });

        var config = await _cadastroService.ObterConfiguracaoPublicaAsync(consultorioId.Value);
        if (config is null)
            return NotFound(new { erro = "Consultório não encontrado" });

        var primeiraData = DateTime.Today.AddDays(1);
        var ultimaData = DateTime.Today.AddDays(config.DiasAgenda);
        if (request.DataHoraInicio.Date < primeiraData || request.DataHoraInicio.Date > ultimaData)
            return BadRequest(new { erro = "Data fora do período de agendamento" });

        var paciente = await _cadastroService.CriarOuBuscarPacienteAsync(
            consultorioId.Value, request.Nome, request.Email, request.TelefoneCelular);

        var agDto = new AgendamentoRequest(request.ProfissionalId, request.ServicoId, request.DataHoraInicio);
        var result = await _agendamentoService.CriarAgendamentoAsync(consultorioId.Value, paciente.Id, agDto);

        if (result is null)
            return Conflict(new { erro = "Horário indisponível" });

        return Ok(result);
    }
}

public record AgendamentoPublicoRequest(
    Guid? ProfissionalId,
    Guid ServicoId,
    DateTime DataHoraInicio,
    [Required][MaxLength(200)] string Nome,
    [EmailAddress][MaxLength(100)] string? Email,
    [Required][MaxLength(20)] string TelefoneCelular
);
