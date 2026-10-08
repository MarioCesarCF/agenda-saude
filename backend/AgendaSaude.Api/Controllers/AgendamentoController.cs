using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AgendamentoController : ApiControllerBase
{
    private readonly AgendamentoService _agendamentoService;

    public AgendamentoController(AgendamentoService agendamentoService)
    {
        _agendamentoService = agendamentoService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] DateTime? data, [FromQuery] Guid? profissionalId,
        [FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();

        var result = await _agendamentoService.ListarAgendamentosAsync(
            consultorioId, data, profissionalId, dataInicio, dataFim);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] AgendamentoRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();

        var result = await _agendamentoService.CriarAgendamentoAsync(consultorioId, usuarioId, request);
        if (result is null)
            return Conflict(new { erro = "Conflito de horário ou dados inválidos" });

        return Ok(result);
    }

    [HttpPost("admin")]
    public async Task<IActionResult> CriarAdmin([FromBody] AgendamentoAdminRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();

        var dto = new AgendamentoRequest(request.ProfissionalId, request.ServicoId, request.DataHoraInicio);
        var result = await _agendamentoService.CriarAgendamentoAsync(consultorioId, request.PacienteId, dto);
        if (result is null)
            return Conflict(new { erro = "Conflito de horário ou dados inválidos" });

        return Ok(result);
    }

    [HttpPatch("{id:guid}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();

        var result = await _agendamentoService.CancelarAgendamentoAsync(id, consultorioId);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> AtualizarStatus(Guid id, [FromBody] AtualizarStatusRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();

        if (!Enum.TryParse<StatusAgendamento>(request.Status, out var novoStatus))
            return BadRequest(new { erro = "Status inválido" });

        var result = await _agendamentoService.AtualizarStatusAsync(id, consultorioId, novoStatus);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id, [FromBody] ExcluirAgendamentoRequest? request = null)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();

        var result = await _agendamentoService.ExcluirAgendamentoAsync(
            id, consultorioId, usuarioId, request?.Motivo);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id:guid}/reagendar")]
    public async Task<IActionResult> Reagendar(Guid id, [FromBody] ReagendarRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();

        var result = await _agendamentoService.ReagendarAsync(
            id, consultorioId, usuarioId, request.NovaDataHoraInicio);
        if (result is null)
            return BadRequest(new { erro = "Agendamento não encontrado ou conflito de horário" });
        return Ok(result);
    }
}

public record AgendamentoAdminRequest(Guid ProfissionalId, Guid ServicoId, Guid PacienteId, DateTime DataHoraInicio);
