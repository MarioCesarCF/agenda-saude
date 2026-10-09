using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/pacientes")]
[Authorize(Policy = "PacienteOnly")]
public class PacienteController : ApiControllerBase
{
    private readonly AgendamentoService _agendamentoService;

    public PacienteController(AgendamentoService agendamentoService)
    {
        _agendamentoService = agendamentoService;
    }

    [HttpGet("agendamentos")]
    public async Task<IActionResult> ListarAgendamentos()
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        if (!TryGetUsuarioId(out var pacienteId)) return Unauthorized();

        return Ok(await _agendamentoService.ListarAgendamentosDoPacienteAsync(consultorioId, pacienteId));
    }

    [HttpPatch("agendamentos/{id:guid}/cancelar")]
    public async Task<IActionResult> CancelarAgendamento(Guid id)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        if (!TryGetUsuarioId(out var pacienteId)) return Unauthorized();

        var result = await _agendamentoService.CancelarAgendamentoDoPacienteAsync(id, consultorioId, pacienteId);
        if (!result) return NotFound();
        return NoContent();
    }
}