using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/publico/{consultorioId:guid}")]
[EnableRateLimiting("publico")]
public class PublicoController : ControllerBase
{
    private readonly CadastroService _cadastroService;
    private readonly AgendamentoService _agendamentoService;

    public PublicoController(
        CadastroService cadastroService,
        AgendamentoService agendamentoService)
    {
        _cadastroService = cadastroService;
        _agendamentoService = agendamentoService;
    }

    [HttpGet("profissionais")]
    public async Task<IActionResult> ListarProfissionais(
        Guid consultorioId, [FromQuery] Guid? servicoId = null)
    {
        var result = await _cadastroService.ListarProfissionaisAsync(consultorioId, servicoId);
        return Ok(result);
    }

    [HttpGet("servicos")]
    public async Task<IActionResult> ListarServicos(
        Guid consultorioId, [FromQuery] Guid? profissionalId = null)
    {
        var result = await _cadastroService.ListarServicosAsync(consultorioId, profissionalId);
        return Ok(result);
    }

    [HttpGet("horarios-disponiveis")]
    public async Task<IActionResult> HorariosDisponiveis(
        Guid consultorioId, [FromQuery] Guid? profissionalId,
        [FromQuery] Guid? servicoId = null,
        [FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
    {
        var inicio = dataInicio ?? DateTime.Today;
        var fim = dataFim ?? DateTime.Today.AddDays(14);

        if (profissionalId.HasValue)
        {
            var result = await _agendamentoService.ObterHorariosDisponiveisAsync(
                consultorioId, profissionalId.Value, servicoId, inicio, fim);
            return Ok(result);
        }

        if (servicoId.HasValue)
        {
            var result = await _agendamentoService.ObterHorariosDisponiveisSemProfissionalAsync(
                consultorioId, servicoId.Value, inicio, fim);
            return Ok(result);
        }

        return BadRequest(new { erro = "profissionalId ou servicoId é obrigatório" });
    }

    [HttpGet("configuracao")]
    public async Task<IActionResult> ObterConfiguracao(Guid consultorioId)
    {
        var result = await _cadastroService.ObterConfiguracaoPublicaAsync(consultorioId);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPost("agendar")]
    public async Task<IActionResult> Agendar(
        Guid consultorioId, [FromBody] AgendamentoPublicoRequest request)
    {
        var config = await _cadastroService.ObterConfiguracaoPublicaAsync(consultorioId);
        if (config is null)
            return NotFound(new { erro = "Consultório não encontrado" });

        var primeiraData = DateTime.Today.AddDays(1);
        var ultimaData = DateTime.Today.AddDays(config.DiasAgenda);
        if (request.DataHoraInicio.Date < primeiraData || request.DataHoraInicio.Date > ultimaData)
            return BadRequest(new { erro = "Data fora do período de agendamento" });

        var paciente = await _cadastroService.CriarOuBuscarPacienteAsync(
            consultorioId, request.Nome, request.Email, request.TelefoneCelular);

        var agDto = new AgendamentoRequest(request.ProfissionalId, request.ServicoId, request.DataHoraInicio);
        var result = await _agendamentoService.CriarAgendamentoAsync(consultorioId, paciente.Id, agDto);

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
