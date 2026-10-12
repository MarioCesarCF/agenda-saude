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
    private readonly ConsultorioResolver _consultorioResolver;

    public AuthController(
        AuthService authService,
        ResetSenhaService resetSenhaService,
        ConsultorioResolver consultorioResolver)
    {
        _authService = authService;
        _resetSenhaService = resetSenhaService;
        _consultorioResolver = consultorioResolver;
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

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var result = await _authService.RefreshAdminAsync(request.RefreshToken);
        if (result is null)
            return Unauthorized(new { erro = "Sessão expirada" });

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

    [HttpPost("cadastro-paciente/{consultorio}")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> CadastrarPaciente(string consultorio, [FromBody] CadastroPacienteRequest request)
    {
        var consultorioId = await _consultorioResolver.ResolverIdAsync(consultorio);
        if (consultorioId is null)
            return NotFound(new { erro = "Consultório não encontrado" });

        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { erro = "Informe um email válido" });

        var result = await _authService.CadastrarPacienteAsync(consultorioId.Value, request);
        if (result is null)
            return Conflict(new { erro = "Email já cadastrado neste consultório" });

        return Ok(result);
    }

    [HttpPost("login-paciente/{consultorio}")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> LoginPaciente(string consultorio, [FromBody] LoginPacienteRequest request)
    {
        var consultorioId = await _consultorioResolver.ResolverIdAsync(consultorio);
        if (consultorioId is null)
            return NotFound(new { erro = "Consultório não encontrado" });

        var result = await _authService.LoginPacienteAsync(consultorioId.Value, request);
        if (result is null)
            return Unauthorized(new { erro = "Email ou senha inválidos" });

        return Ok(result);
    }

    [HttpPost("refresh-paciente")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> RefreshPaciente([FromBody] RefreshRequest request)
    {
        var result = await _authService.RefreshPacienteAsync(request.RefreshToken);
        if (result is null)
            return Unauthorized(new { erro = "Sessão expirada" });

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

    [HttpPost("google/{consultorio}")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> LoginGoogle(string consultorio, [FromBody] GoogleLoginRequest request)
    {
        var consultorioId = await _consultorioResolver.ResolverIdAsync(consultorio);
        if (consultorioId is null)
            return NotFound(new { erro = "Consultório não encontrado" });

        var result = await _authService.LoginGoogleAsync(consultorioId.Value, request.Token);
        if (result is null)
            return Unauthorized(new { erro = "Falha na autenticação com Google" });

        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest? request)
    {
        await _authService.LogoutAsync(request?.RefreshToken);
        return Ok(new { mensagem = "Logout realizado com sucesso" });
    }

    [HttpPost("logout-paciente")]
    public async Task<IActionResult> LogoutPaciente([FromBody] RefreshRequest? request)
    {
        await _authService.LogoutAsync(request?.RefreshToken);
        return Ok(new { mensagem = "Logout realizado com sucesso" });
    }
}
