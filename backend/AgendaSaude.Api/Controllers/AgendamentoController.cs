using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AgendamentoController : ControllerBase
{
    private readonly AgendamentoService _agendamentoService;

    public AgendamentoController(AgendamentoService agendamentoService)
    {
        _agendamentoService = agendamentoService;
    }

    private Guid ConsultorioId
    {
        get
        {
            var value = User.FindFirstValue("ConsultorioId");
            return Guid.TryParse(value, out var id) ? id : Guid.Empty;
        }
    }

    private Guid UsuarioId
    {
        get
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : Guid.Empty;
        }
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] DateTime? data, [FromQuery] Guid? profissionalId,
        [FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
    {
        var result = await _agendamentoService.ListarAgendamentosAsync(
            ConsultorioId, data, profissionalId, dataInicio, dataFim);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] AgendamentoRequest request)
    {
        var result = await _agendamentoService.CriarAgendamentoAsync(ConsultorioId, UsuarioId, request);
        if (result is null)
            return Conflict(new { erro = "Conflito de horário ou dados inválidos" });

        return Ok(result);
    }

    [HttpPost("admin")]
    public async Task<IActionResult> CriarAdmin([FromBody] AgendamentoAdminRequest request)
    {
        var dto = new AgendamentoRequest(request.ProfissionalId, request.ServicoId, request.DataHoraInicio);
        var result = await _agendamentoService.CriarAgendamentoAsync(ConsultorioId, request.PacienteId, dto);
        if (result is null)
            return Conflict(new { erro = "Conflito de horário ou dados inválidos" });

        return Ok(result);
    }

    [HttpPatch("{id:guid}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid id)
    {
        var result = await _agendamentoService.CancelarAgendamentoAsync(id, ConsultorioId);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> AtualizarStatus(Guid id, [FromBody] AtualizarStatusRequest request)
    {
        if (!Enum.TryParse<StatusAgendamento>(request.Status, out var novoStatus))
            return BadRequest(new { erro = "Status inválido" });

        var result = await _agendamentoService.AtualizarStatusAsync(id, ConsultorioId, novoStatus);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id, [FromBody] ExcluirAgendamentoRequest? request = null)
    {
        var result = await _agendamentoService.ExcluirAgendamentoAsync(
            id, ConsultorioId, UsuarioId, request?.Motivo);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id:guid}/reagendar")]
    public async Task<IActionResult> Reagendar(Guid id, [FromBody] ReagendarRequest request)
    {
        var result = await _agendamentoService.ReagendarAsync(
            id, ConsultorioId, UsuarioId, request.NovaDataHoraInicio);
        if (result is null)
            return BadRequest(new { erro = "Agendamento não encontrado ou conflito de horário" });
        return Ok(result);
    }
}

public record AgendamentoAdminRequest(Guid ProfissionalId, Guid ServicoId, Guid PacienteId, DateTime DataHoraInicio);
