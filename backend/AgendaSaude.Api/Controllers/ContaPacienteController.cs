using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/conta-paciente")]
[Authorize(Policy = "ContaPacienteOnly")]
public class ContaPacienteController : ApiControllerBase
{
    private readonly ContaPacienteService _contaPacienteService;

    public ContaPacienteController(ContaPacienteService contaPacienteService)
    {
        _contaPacienteService = contaPacienteService;
    }

    [HttpGet("perfil")]
    public async Task<IActionResult> ObterPerfil()
    {
        if (!TryGetContaPacienteId(out var contaId)) return Unauthorized();

        var result = await _contaPacienteService.ObterPerfilAsync(contaId);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpGet("agendamentos")]
    public async Task<IActionResult> ListarAgendamentos()
    {
        if (!TryGetContaPacienteId(out var contaId)) return Unauthorized();
        return Ok(await _contaPacienteService.ListarAgendamentosAsync(contaId));
    }

    [HttpPatch("agendamentos/{id:guid}/cancelar")]
    public async Task<IActionResult> CancelarAgendamento(Guid id)
    {
        if (!TryGetContaPacienteId(out var contaId)) return Unauthorized();

        var result = await _contaPacienteService.CancelarAgendamentoAsync(contaId, id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("agendamentos/{id:guid}/reagendar")]
    public async Task<IActionResult> ReagendarAgendamento(Guid id, [FromBody] ReagendarRequest request)
    {
        if (!TryGetContaPacienteId(out var contaId)) return Unauthorized();

        var result = await _contaPacienteService.ReagendarAgendamentoAsync(contaId, id, request.NovaDataHoraInicio);
        if (result is null)
            return BadRequest(new { erro = "Agendamento não encontrado ou conflito de horário" });
        return Ok(result);
    }
}