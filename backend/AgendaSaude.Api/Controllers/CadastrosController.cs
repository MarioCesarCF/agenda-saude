using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class CadastrosController : ApiControllerBase
{
    private readonly CadastroService _cadastroService;

    public CadastrosController(CadastroService cadastroService)
    {
        _cadastroService = cadastroService;
    }

    [HttpPost("profissionais")]
    public async Task<IActionResult> CriarProfissional([FromBody] ProfissionalRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.CriarProfissionalAsync(consultorioId, request);
        return Ok(result);
    }

    [HttpGet("profissionais")]
    public async Task<IActionResult> ListarProfissionais()
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.ListarProfissionaisAsync(consultorioId);
        return Ok(result);
    }

    [HttpPost("servicos")]
    public async Task<IActionResult> CriarServico([FromBody] ServicoRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.CriarServicoAsync(consultorioId, request);
        return Ok(result);
    }

    [HttpGet("servicos")]
    public async Task<IActionResult> ListarServicos()
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.ListarServicosAsync(consultorioId);
        return Ok(result);
    }

    [HttpPut("profissionais/{id:guid}")]
    public async Task<IActionResult> AtualizarProfissional(Guid id, [FromBody] ProfissionalRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.AtualizarProfissionalAsync(consultorioId, id, request);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("profissionais/{id:guid}")]
    public async Task<IActionResult> ExcluirProfissional(Guid id)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.ExcluirProfissionalAsync(consultorioId, id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPut("servicos/{id:guid}")]
    public async Task<IActionResult> AtualizarServico(Guid id, [FromBody] ServicoRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.AtualizarServicoAsync(consultorioId, id, request);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("servicos/{id:guid}")]
    public async Task<IActionResult> ExcluirServico(Guid id)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.ExcluirServicoAsync(consultorioId, id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("pacientes")]
    public async Task<IActionResult> CriarPaciente([FromBody] PacienteCompletoRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.CriarPacienteCompletoAsync(consultorioId, request);
        if (result is null)
            return Conflict(new { erro = "Email já cadastrado" });
        return Ok(result);
    }

    [HttpPost("horarios")]
    public async Task<IActionResult> CriarHorario([FromBody] HorarioDisponivelRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.CriarHorarioAsync(consultorioId, request);
        if (!result) return BadRequest(new { erro = "Horários inválidos" });
        return Ok();
    }

    [HttpGet("horarios")]
    public async Task<IActionResult> ListarHorarios()
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        return Ok(await _cadastroService.ListarHorariosAsync(consultorioId));
    }

    [HttpDelete("horarios/{id:guid}")]
    public async Task<IActionResult> ExcluirHorario(Guid id)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.ExcluirHorarioAsync(consultorioId, id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("bloqueios")]
    public async Task<IActionResult> CriarBloqueio([FromBody] BloqueioAgendaRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.CriarBloqueioAsync(consultorioId, request);
        return Ok(result);
    }

    [HttpGet("configuracao")]
    public async Task<IActionResult> ObterConfiguracao()
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.ObterConfiguracaoAsync(consultorioId);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPut("configuracao")]
    public async Task<IActionResult> AtualizarConfiguracao([FromBody] ConfiguracaoUpdateRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.AtualizarConfiguracaoAsync(consultorioId, request);
        if (!result) return NotFound();
        return Ok(await _cadastroService.ObterConfiguracaoAsync(consultorioId));
    }

    [HttpGet("vinculos")]
    public async Task<IActionResult> ListarVinculos()
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        return Ok(await _cadastroService.ListarVinculosAsync(consultorioId));
    }

    [HttpPost("vinculos")]
    public async Task<IActionResult> VincularServico([FromBody] VincularServicoRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.VincularServicoAsync(consultorioId, request);
        if (!result) return Conflict(new { erro = "Vínculo já existe ou dados inválidos" });
        return Ok();
    }

    [HttpDelete("vinculos")]
    public async Task<IActionResult> DesvincularServico([FromBody] VincularServicoRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _cadastroService.DesvincularServicoAsync(consultorioId, request);
        if (!result) return NotFound();
        return NoContent();
    }
}
