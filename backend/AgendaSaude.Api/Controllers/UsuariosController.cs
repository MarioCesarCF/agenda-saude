using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsuariosController : ApiControllerBase
{
    private readonly UsuariosService _usuariosService;

    public UsuariosController(UsuariosService usuariosService)
    {
        _usuariosService = usuariosService;
    }

    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Listar()
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _usuariosService.ListarUsuariosAsync(consultorioId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Criar([FromBody] CriarUsuarioRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _usuariosService.CriarUsuarioAsync(consultorioId, request);
        if (result is null)
            return Conflict(new { erro = "Email já cadastrado neste consultório" });
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarUsuarioRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        var result = await _usuariosService.AtualizarUsuarioAsync(consultorioId, id, request);
        if (result is null)
            return NotFound(new { erro = "Usuário não encontrado ou email já em uso" });
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Excluir(Guid id)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();

        var result = await _usuariosService.ExcluirUsuarioAsync(consultorioId, id, usuarioId);
        if (!result)
            return BadRequest(new { erro = "Não é possível excluir a si mesmo ou usuário não encontrado" });
        return NoContent();
    }

    [HttpGet("perfil")]
    public async Task<IActionResult> ObterPerfil()
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();

        var result = await _usuariosService.ObterPerfilAsync(consultorioId, usuarioId);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPut("perfil")]
    public async Task<IActionResult> AtualizarPerfil([FromBody] AtualizarPerfilProprioRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();

        var result = await _usuariosService.AtualizarPerfilProprioAsync(
            consultorioId, usuarioId, request);
        if (result is null)
            return BadRequest(new { erro = "Email já em uso por outro usuário" });
        return Ok(result);
    }

    [HttpPatch("perfil/senha")]
    public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaRequest request)
    {
        if (!TryGetConsultorioId(out var consultorioId)) return Unauthorized();
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();

        var result = await _usuariosService.AlterarSenhaAsync(
            consultorioId, usuarioId, request);
        if (!result)
            return BadRequest(new { erro = "Senha atual incorreta" });
        return Ok(new { mensagem = "Senha alterada com sucesso" });
    }
}
