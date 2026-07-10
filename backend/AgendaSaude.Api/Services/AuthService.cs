using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;

namespace AgendaSaude.Api.Services;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;

    public AuthService(AppDbContext context, TokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Consultorio)
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.Ativo);

        if (usuario is null || !BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash))
            return null;

        var token = _tokenService.GerarToken(
            usuario.Id, usuario.Email, usuario.Nome,
            usuario.Perfil.ToString(), usuario.ConsultorioId);

        var c = usuario.Consultorio;
        return new LoginResponse(token, usuario.Nome, usuario.Email,
            usuario.Perfil.ToString(), usuario.ConsultorioId,
            c.NomeFantasia, c.Tema, c.CorPrimaria, c.CorSecundaria,
            c.CorDestaque, c.Icone, c.DiasAgenda);
    }

    public async Task<CadastroConsultorioResponse?> CadastrarConsultorioAsync(CadastroConsultorioRequest request)
    {
        var existente = await _context.Consultorios.AnyAsync(c => c.Email == request.Email);
        if (existente) return null;

        var consultorio = new Consultorio
        {
            NomeFantasia = request.NomeFantasia,
            Email = request.Email,
            TelefoneCelular = request.TelefoneCelular,
            Documento = request.Documento,
            Logradouro = request.Logradouro,
            Numero = request.Numero,
            Bairro = request.Bairro,
            Cidade = request.Cidade,
            Estado = request.Estado,
            CEP = request.CEP,
            Tema = request.Tema ?? "light",
            CorPrimaria = request.CorPrimaria ?? "#059669",
            CorSecundaria = request.CorSecundaria ?? "#10b981",
            CorDestaque = request.CorDestaque ?? "#f59e0b",
            Icone = request.Icone,
            DiasAgenda = request.DiasAgenda ?? 2
        };

        _context.Consultorios.Add(consultorio);

        var usuario = new Usuario
        {
            ConsultorioId = consultorio.Id,
            Nome = request.NomeFantasia,
            Email = request.Email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
            Perfil = PerfilUsuario.Admin
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return new CadastroConsultorioResponse(consultorio.Id, consultorio.NomeFantasia, consultorio.Email);
    }

    public async Task<CadastroPacienteResponse?> CadastrarPacienteAsync(Guid consultorioId, CadastroPacienteRequest request)
    {
        var existente = await _context.Pacientes
            .AnyAsync(p => p.Email == request.Email && p.ConsultorioId == consultorioId);
        if (existente) return null;

        var paciente = new Paciente
        {
            ConsultorioId = consultorioId,
            Nome = request.Nome,
            Email = request.Email,
            TelefoneCelular = request.TelefoneCelular,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha)
        };

        _context.Pacientes.Add(paciente);
        await _context.SaveChangesAsync();

        return new CadastroPacienteResponse(paciente.Id, paciente.Nome, paciente.Email!);
    }
}
