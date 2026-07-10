using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (result is null)
            return Unauthorized(new { erro = "Email ou senha inválidos" });

        return Ok(result);
    }

    [HttpPost("cadastro-consultorio")]
    public async Task<IActionResult> CadastrarConsultorio([FromBody] CadastroConsultorioRequest request)
    {
        var result = await _authService.CadastrarConsultorioAsync(request);
        if (result is null)
            return Conflict(new { erro = "Email já cadastrado" });
        return Ok(result);
    }

    [HttpPost("cadastro-paciente/{consultorioId:guid}")]
    public async Task<IActionResult> CadastrarPaciente(Guid consultorioId, [FromBody] CadastroPacienteRequest request)
    {
        var result = await _authService.CadastrarPacienteAsync(consultorioId, request);
        if (result is null)
            return Conflict(new { erro = "Email já cadastrado neste consultório" });

        return Ok(result);
    }
}
