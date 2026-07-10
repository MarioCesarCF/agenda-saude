using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;

namespace AgendaSaude.Api.Services;

public class UsuariosService
{
    private readonly AppDbContext _context;

    public UsuariosService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UsuarioResponse>> ListarUsuariosAsync(Guid consultorioId)
    {
        return await _context.Usuarios
            .Where(u => u.ConsultorioId == consultorioId)
            .OrderBy(u => u.Nome)
            .Select(u => new UsuarioResponse(
                u.Id, u.Nome, u.Email, u.Perfil.ToString(), u.Ativo, u.DataCadastro))
            .ToListAsync();
    }

    public async Task<UsuarioResponse?> CriarUsuarioAsync(
        Guid consultorioId, CriarUsuarioRequest request)
    {
        var existente = await _context.Usuarios
            .AnyAsync(u => u.Email == request.Email && u.ConsultorioId == consultorioId);
        if (existente) return null;

        if (!Enum.TryParse<PerfilUsuario>(request.Perfil, out var perfil))
            perfil = PerfilUsuario.Atendente;

        var usuario = new Usuario
        {
            ConsultorioId = consultorioId,
            Nome = request.Nome,
            Email = request.Email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
            Perfil = perfil
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return new UsuarioResponse(
            usuario.Id, usuario.Nome, usuario.Email,
            usuario.Perfil.ToString(), usuario.Ativo, usuario.DataCadastro);
    }

    public async Task<UsuarioResponse?> AtualizarUsuarioAsync(
        Guid consultorioId, Guid id, AtualizarUsuarioRequest request)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id && u.ConsultorioId == consultorioId);
        if (usuario is null) return null;

        var emailExistente = await _context.Usuarios
            .AnyAsync(u => u.Email == request.Email
                && u.ConsultorioId == consultorioId
                && u.Id != id);
        if (emailExistente) return null;

        usuario.Nome = request.Nome;
        usuario.Email = request.Email;

        if (request.Perfil is not null
            && Enum.TryParse<PerfilUsuario>(request.Perfil, out var perfil))
        {
            usuario.Perfil = perfil;
        }

        await _context.SaveChangesAsync();

        return new UsuarioResponse(
            usuario.Id, usuario.Nome, usuario.Email,
            usuario.Perfil.ToString(), usuario.Ativo, usuario.DataCadastro);
    }

    public async Task<bool> ExcluirUsuarioAsync(
        Guid consultorioId, Guid id, Guid operadorId)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id && u.ConsultorioId == consultorioId);
        if (usuario is null) return false;
        if (usuario.Id == operadorId) return false;

        usuario.Ativo = false;

        _context.HistoricoAcoes.Add(new HistoricoAcao
        {
            ConsultorioId = consultorioId,
            UsuarioId = operadorId,
            Acao = "ExcluirUsuario",
            Entidade = "Usuario",
            EntidadeId = id.ToString(),
            Detalhes = JsonSerializer.Serialize(new
            {
                nome = usuario.Nome,
                email = usuario.Email,
                perfil = usuario.Perfil.ToString()
            })
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<UsuarioResponse?> ObterPerfilAsync(
        Guid consultorioId, Guid usuarioId)
    {
        return await _context.Usuarios
            .Where(u => u.Id == usuarioId && u.ConsultorioId == consultorioId)
            .Select(u => new UsuarioResponse(
                u.Id, u.Nome, u.Email, u.Perfil.ToString(), u.Ativo, u.DataCadastro))
            .FirstOrDefaultAsync();
    }

    public async Task<UsuarioResponse?> AtualizarPerfilProprioAsync(
        Guid consultorioId, Guid usuarioId, AtualizarPerfilProprioRequest request)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == usuarioId && u.ConsultorioId == consultorioId);
        if (usuario is null) return null;

        var emailExistente = await _context.Usuarios
            .AnyAsync(u => u.Email == request.Email
                && u.ConsultorioId == consultorioId
                && u.Id != usuarioId);
        if (emailExistente) return null;

        usuario.Nome = request.Nome;
        usuario.Email = request.Email;
        await _context.SaveChangesAsync();

        return new UsuarioResponse(
            usuario.Id, usuario.Nome, usuario.Email,
            usuario.Perfil.ToString(), usuario.Ativo, usuario.DataCadastro);
    }

    public async Task<bool> AlterarSenhaAsync(
        Guid consultorioId, Guid usuarioId, AlterarSenhaRequest request)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == usuarioId && u.ConsultorioId == consultorioId);
        if (usuario is null) return false;

        if (!BCrypt.Net.BCrypt.Verify(request.SenhaAtual, usuario.SenhaHash))
            return false;

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);
        await _context.SaveChangesAsync();
        return true;
    }
}
