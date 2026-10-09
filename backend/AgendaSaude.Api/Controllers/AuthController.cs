using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ResetSenhaService _resetSenhaService;

    public AuthController(AuthService authService, ResetSenhaService resetSenhaService)
    {
        _authService = authService;
        _resetSenhaService = resetSenhaService;
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (result is null)
            return Unauthorized(new { erro = "Email ou senha inválidos" });

        return Ok(result);
    }

    [HttpPost("cadastro-consultorio")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> CadastrarConsultorio([FromBody] CadastroConsultorioRequest request)
    {
        var result = await _authService.CadastrarConsultorioAsync(request);
        if (result is null)
            return Conflict(new { erro = "Email já cadastrado" });
        return Ok(result);
    }

    [HttpPost("cadastro-paciente/{consultorioId:guid}")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> CadastrarPaciente(Guid consultorioId, [FromBody] CadastroPacienteRequest request)
    {
        var result = await _authService.CadastrarPacienteAsync(consultorioId, request);
        if (result is null)
            return Conflict(new { erro = "Email já cadastrado neste consultório" });

        return Ok(result);
    }

    [HttpPost("login-paciente/{consultorioId:guid}")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> LoginPaciente(Guid consultorioId, [FromBody] LoginPacienteRequest request)
    {
        var result = await _authService.LoginPacienteAsync(consultorioId, request);
        if (result is null)
            return Unauthorized(new { erro = "Email ou senha inválidos" });

        return Ok(result);
    }

    [HttpPost("solicitar-reset")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> SolicitarReset([FromBody] SolicitarResetRequest request)
    {
        await _resetSenhaService.SolicitarResetAsync(request.Email);
        return Ok(new { mensagem = "Se o email estiver cadastrado, você receberá um código de recuperação." });
    }

    [HttpPost("resetar-senha")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ResetarSenha([FromBody] ResetarSenhaRequest request)
    {
        var ok = await _resetSenhaService.ResetarSenhaAsync(request.Token, request.NovaSenha);
        if (!ok)
            return BadRequest(new { erro = "Código inválido ou expirado" });

        return Ok(new { mensagem = "Senha redefinida com sucesso" });
    }

    [HttpPost("google/{consultorioId:guid}")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> LoginGoogle(Guid consultorioId, [FromBody] GoogleLoginRequest request)
    {
        var result = await _authService.LoginGoogleAsync(consultorioId, request.Token);
        if (result is null)
            return Unauthorized(new { erro = "Falha na autenticação com Google" });

        return Ok(result);
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { mensagem = "Logout realizado com sucesso" });
    }
}
