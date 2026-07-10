using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class CadastrosController : ControllerBase
{
    private readonly CadastroService _cadastroService;

    public CadastrosController(CadastroService cadastroService)
    {
        _cadastroService = cadastroService;
    }

    private Guid ConsultorioId => Guid.Parse(User.FindFirstValue("ConsultorioId")!);

    [HttpPost("profissionais")]
    public async Task<IActionResult> CriarProfissional([FromBody] ProfissionalRequest request)
    {
        var result = await _cadastroService.CriarProfissionalAsync(ConsultorioId, request);
        return Ok(result);
    }

    [HttpGet("profissionais")]
    public async Task<IActionResult> ListarProfissionais()
    {
        var result = await _cadastroService.ListarProfissionaisAsync(ConsultorioId);
        return Ok(result);
    }

    [HttpPost("servicos")]
    public async Task<IActionResult> CriarServico([FromBody] ServicoRequest request)
    {
        var result = await _cadastroService.CriarServicoAsync(ConsultorioId, request);
        return Ok(result);
    }

    [HttpGet("servicos")]
    public async Task<IActionResult> ListarServicos()
    {
        var result = await _cadastroService.ListarServicosAsync(ConsultorioId);
        return Ok(result);
    }

    [HttpPut("profissionais/{id:guid}")]
    public async Task<IActionResult> AtualizarProfissional(Guid id, [FromBody] ProfissionalRequest request)
    {
        var result = await _cadastroService.AtualizarProfissionalAsync(ConsultorioId, id, request);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("profissionais/{id:guid}")]
    public async Task<IActionResult> ExcluirProfissional(Guid id)
    {
        var result = await _cadastroService.ExcluirProfissionalAsync(ConsultorioId, id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPut("servicos/{id:guid}")]
    public async Task<IActionResult> AtualizarServico(Guid id, [FromBody] ServicoRequest request)
    {
        var result = await _cadastroService.AtualizarServicoAsync(ConsultorioId, id, request);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("servicos/{id:guid}")]
    public async Task<IActionResult> ExcluirServico(Guid id)
    {
        var result = await _cadastroService.ExcluirServicoAsync(ConsultorioId, id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("pacientes")]
    public async Task<IActionResult> CriarPaciente([FromBody] PacienteCompletoRequest request)
    {
        var result = await _cadastroService.CriarPacienteCompletoAsync(ConsultorioId, request);
        if (result is null)
            return Conflict(new { erro = "Email já cadastrado" });
        return Ok(result);
    }

    [HttpPost("horarios")]
    public async Task<IActionResult> CriarHorario([FromBody] HorarioDisponivelRequest request)
    {
        var result = await _cadastroService.CriarHorarioAsync(ConsultorioId, request);
        if (!result) return BadRequest(new { erro = "Horários inválidos" });
        return Ok();
    }

    [HttpGet("horarios")]
    public async Task<IActionResult> ListarHorarios()
    {
        return Ok(await _cadastroService.ListarHorariosAsync(ConsultorioId));
    }

    [HttpDelete("horarios/{id:guid}")]
    public async Task<IActionResult> ExcluirHorario(Guid id)
    {
        var result = await _cadastroService.ExcluirHorarioAsync(ConsultorioId, id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("bloqueios")]
    public async Task<IActionResult> CriarBloqueio([FromBody] BloqueioAgendaRequest request)
    {
        var result = await _cadastroService.CriarBloqueioAsync(ConsultorioId, request);
        return Ok(result);
    }

    [HttpGet("configuracao")]
    public async Task<IActionResult> ObterConfiguracao()
    {
        var result = await _cadastroService.ObterConfiguracaoAsync(ConsultorioId);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPut("configuracao")]
    public async Task<IActionResult> AtualizarConfiguracao([FromBody] ConfiguracaoUpdateRequest request)
    {
        var result = await _cadastroService.AtualizarConfiguracaoAsync(ConsultorioId, request);
        if (!result) return NotFound();
        return Ok(await _cadastroService.ObterConfiguracaoAsync(ConsultorioId));
    }

    [HttpGet("vinculos")]
    public async Task<IActionResult> ListarVinculos()
    {
        return Ok(await _cadastroService.ListarVinculosAsync(ConsultorioId));
    }

    [HttpPost("vinculos")]
    public async Task<IActionResult> VincularServico([FromBody] VincularServicoRequest request)
    {
        var result = await _cadastroService.VincularServicoAsync(ConsultorioId, request);
        if (!result) return Conflict(new { erro = "Vínculo já existe ou dados inválidos" });
        return Ok();
    }

    [HttpDelete("vinculos")]
    public async Task<IActionResult> DesvincularServico([FromBody] VincularServicoRequest request)
    {
        var result = await _cadastroService.DesvincularServicoAsync(ConsultorioId, request);
        if (!result) return NotFound();
        return NoContent();
    }
}
