using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsuariosController : ControllerBase
{
    private readonly UsuariosService _usuariosService;

    public UsuariosController(UsuariosService usuariosService)
    {
        _usuariosService = usuariosService;
    }

    private Guid ConsultorioId => Guid.Parse(User.FindFirstValue("ConsultorioId")!);
    private Guid UsuarioId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Listar()
    {
        var result = await _usuariosService.ListarUsuariosAsync(ConsultorioId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Criar([FromBody] CriarUsuarioRequest request)
    {
        var result = await _usuariosService.CriarUsuarioAsync(ConsultorioId, request);
        if (result is null)
            return Conflict(new { erro = "Email já cadastrado neste consultório" });
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarUsuarioRequest request)
    {
        var result = await _usuariosService.AtualizarUsuarioAsync(ConsultorioId, id, request);
        if (result is null)
            return NotFound(new { erro = "Usuário não encontrado ou email já em uso" });
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        var result = await _usuariosService.ExcluirUsuarioAsync(ConsultorioId, id, UsuarioId);
        if (!result)
            return BadRequest(new { erro = "Não é possível excluir a si mesmo ou usuário não encontrado" });
        return NoContent();
    }

    [HttpGet("perfil")]
    public async Task<IActionResult> ObterPerfil()
    {
        var result = await _usuariosService.ObterPerfilAsync(ConsultorioId, UsuarioId);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPut("perfil")]
    public async Task<IActionResult> AtualizarPerfil([FromBody] AtualizarPerfilProprioRequest request)
    {
        var result = await _usuariosService.AtualizarPerfilProprioAsync(
            ConsultorioId, UsuarioId, request);
        if (result is null)
            return BadRequest(new { erro = "Email já em uso por outro usuário" });
        return Ok(result);
    }

    [HttpPatch("perfil/senha")]
    public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaRequest request)
    {
        var result = await _usuariosService.AlterarSenhaAsync(
            ConsultorioId, UsuarioId, request);
        if (!result)
            return BadRequest(new { erro = "Senha atual incorreta" });
        return Ok(new { mensagem = "Senha alterada com sucesso" });
    }
}
