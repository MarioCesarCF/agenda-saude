using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;

namespace AgendaSaude.Api.Services;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly RefreshTokenService _refreshTokenService;
    private readonly INeonSessionValidator _neonSessionValidator;

    public AuthService(
        AppDbContext context,
        TokenService tokenService,
        RefreshTokenService refreshTokenService,
        INeonSessionValidator neonSessionValidator)
    {
        _context = context;
        _tokenService = tokenService;
        _refreshTokenService = refreshTokenService;
        _neonSessionValidator = neonSessionValidator;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Consultorio)
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.Ativo);

        if (usuario is null || !BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash))
            return null;

        return await GerarLoginResponseAsync(usuario);
    }

    public async Task<LoginResponse?> RefreshAdminAsync(string refreshToken)
    {
        var stored = await _refreshTokenService.ValidarAsync(refreshToken);
        if (stored is null || stored.UsuarioId is null) return null;

        var usuario = await _context.Usuarios
            .Include(u => u.Consultorio)
            .FirstOrDefaultAsync(u => u.Id == stored.UsuarioId && u.Ativo);
        if (usuario is null) return null;

        await _refreshTokenService.RevogarAsync(refreshToken);
        return await GerarLoginResponseAsync(usuario);
    }

    private async Task<LoginResponse> GerarLoginResponseAsync(Usuario usuario)
    {
        var token = _tokenService.GerarToken(
            usuario.Id, usuario.Email, usuario.Nome,
            usuario.Perfil.ToString(), usuario.ConsultorioId);

        var refresh = await _refreshTokenService.GerarAsync(usuario.ConsultorioId, usuario.Id, null);

        var c = usuario.Consultorio;
        return new LoginResponse(token, usuario.Id.ToString(), usuario.Nome, usuario.Email,
            usuario.Perfil.ToString(), usuario.ConsultorioId,
            c.NomeFantasia, c.Tema, c.CorPrimaria, c.CorSecundaria,
            c.CorDestaque, c.Icone, c.DiasAgenda, c.Slug, refresh);
    }

    public async Task<CadastroConsultorioResponse?> CadastrarConsultorioAsync(CadastroConsultorioRequest request)
    {
        var existente = await _context.Consultorios.AnyAsync(c => c.Email == request.Email);
        if (existente) return null;

        var slugBase = SlugHelper.Valido(request.Slug)
            ? request.Slug!.Trim().ToLowerInvariant()
            : SlugHelper.Gerar(request.NomeFantasia);
        var slug = await GerarSlugUnicoAsync(slugBase);

        var consultorio = new Consultorio
        {
            NomeFantasia = request.NomeFantasia,
            Slug = slug,
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

        return new CadastroConsultorioResponse(consultorio.Id, consultorio.NomeFantasia, consultorio.Email, consultorio.Slug);
    }

    public async Task<string> GerarSlugUnicoAsync(string baseSlug)
    {
        if (string.IsNullOrWhiteSpace(baseSlug)) baseSlug = "consultorio";

        baseSlug = baseSlug.Trim().Trim('-');
        if (baseSlug.Length < SlugHelper.TamanhoMinimo) baseSlug += "-clinica";
        if (baseSlug.Length > SlugHelper.TamanhoMaximo)
            baseSlug = baseSlug[..SlugHelper.TamanhoMaximo].Trim('-');

        var slug = baseSlug;
        var i = 2;
        while (await _context.Consultorios.AnyAsync(c => c.Slug == slug))
        {
            var sufixo = $"-{i++}";
            var corte = Math.Max(1, Math.Min(baseSlug.Length, SlugHelper.TamanhoMaximo - sufixo.Length));
            slug = baseSlug[..corte].Trim('-') + sufixo;
        }
        return slug;
    }

    public async Task<CadastroPacienteResponse?> CadastrarPacienteAsync(Guid consultorioId, CadastroPacienteRequest request)
    {
        var email = request.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email)) return null;

        var emailNormalizado = email.ToLowerInvariant();
        var paciente = await _context.Pacientes
            .FirstOrDefaultAsync(p => p.ConsultorioId == consultorioId
                && p.Email != null && p.Email.ToLower() == emailNormalizado);

        if (paciente is not null)
        {
            if (paciente.SenhaHash is null && !string.IsNullOrWhiteSpace(request.Senha))
            {
                paciente.SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha);
                await VincularContaPacienteAsync(paciente);
                await _context.SaveChangesAsync();
                return new CadastroPacienteResponse(paciente.Id, paciente.Nome, paciente.Email);
            }

            return null;
        }

        paciente = new Paciente
        {
            ConsultorioId = consultorioId,
            Nome = request.Nome.Trim(),
            Email = email,
            TelefoneCelular = request.TelefoneCelular.Trim(),
            SenhaHash = string.IsNullOrWhiteSpace(request.Senha)
                ? null
                : BCrypt.Net.BCrypt.HashPassword(request.Senha)
        };

        _context.Pacientes.Add(paciente);
        await _context.SaveChangesAsync();

        await VincularContaPacienteAsync(paciente);

        return new CadastroPacienteResponse(paciente.Id, paciente.Nome, paciente.Email);
    }

    public async Task<PacienteLoginResponse?> LoginPacienteAsync(Guid consultorioId, LoginPacienteRequest request)
    {
        var paciente = await _context.Pacientes
            .Include(p => p.Consultorio)
            .FirstOrDefaultAsync(p => p.ConsultorioId == consultorioId
                && p.Email == request.Email && p.Ativo);

        if (paciente is null || paciente.SenhaHash is null
            || !BCrypt.Net.BCrypt.Verify(request.Senha, paciente.SenhaHash))
            return null;

        return await GerarPacienteLoginResponseAsync(paciente);
    }

    public async Task<PacienteLoginResponse?> RefreshPacienteAsync(string refreshToken)
    {
        var stored = await _refreshTokenService.ValidarAsync(refreshToken);
        if (stored is null || stored.PacienteId is null) return null;

        var paciente = await _context.Pacientes
            .Include(p => p.Consultorio)
            .FirstOrDefaultAsync(p => p.Id == stored.PacienteId && p.Ativo);
        if (paciente is null) return null;

        await _refreshTokenService.RevogarAsync(refreshToken);
        return await GerarPacienteLoginResponseAsync(paciente);
    }

    private async Task<PacienteLoginResponse> GerarPacienteLoginResponseAsync(Paciente paciente)
    {
        var token = _tokenService.GerarToken(
            paciente.Id, paciente.Email ?? "", paciente.Nome,
            "Paciente", paciente.ConsultorioId);

        var refresh = await _refreshTokenService.GerarAsync(paciente.ConsultorioId, null, paciente.Id);

        return new PacienteLoginResponse(
            token, paciente.Id.ToString(), paciente.Nome, paciente.Email,
            string.IsNullOrWhiteSpace(paciente.TelefoneCelular) ? null : paciente.TelefoneCelular,
            paciente.ConsultorioId, paciente.Consultorio.Slug, refresh);
    }

    public async Task<GoogleLoginResponse?> LoginGoogleAsync(Guid consultorioId, string sessionToken)
    {
        var info = await _neonSessionValidator.ValidarSessionTokenAsync(sessionToken);
        if (info is null) return null;

        var paciente = await _context.Pacientes
            .FirstOrDefaultAsync(p => p.ConsultorioId == consultorioId && p.GoogleId == info.GoogleId);

        if (paciente is null)
        {
            paciente = await _context.Pacientes
                .FirstOrDefaultAsync(p => p.ConsultorioId == consultorioId && p.Email == info.Email);

            if (paciente is not null)
            {
                paciente.GoogleId = info.GoogleId;
            }
            else
            {
                paciente = new Paciente
                {
                    ConsultorioId = consultorioId,
                    Nome = info.Nome,
                    Email = info.Email,
                    TelefoneCelular = string.Empty,
                    GoogleId = info.GoogleId
                };
                _context.Pacientes.Add(paciente);
            }

            await _context.SaveChangesAsync();
        }

        var slug = await _context.Consultorios
            .Where(c => c.Id == consultorioId)
            .Select(c => c.Slug)
            .FirstOrDefaultAsync() ?? "";

        await VincularContaPacienteAsync(paciente);

        var access = _tokenService.GerarToken(
            paciente.Id, paciente.Email ?? "", paciente.Nome, "Paciente", consultorioId);
        var refresh = await _refreshTokenService.GerarAsync(consultorioId, null, paciente.Id);

        return new GoogleLoginResponse(
            paciente.Id, paciente.Nome, paciente.Email,
            string.IsNullOrWhiteSpace(paciente.TelefoneCelular) ? null : paciente.TelefoneCelular,
            access, refresh, consultorioId, slug);
    }

    private async Task VincularContaPacienteAsync(Paciente paciente)
    {
        if (string.IsNullOrWhiteSpace(paciente.Email) || paciente.ContaPacienteId.HasValue)
            return;

        var email = paciente.Email.Trim().ToLowerInvariant();
        var conta = await _context.ContasPacientes
            .FirstOrDefaultAsync(c => c.Email == email);

        if (conta is not null)
        {
            paciente.ContaPacienteId = conta.Id;
            await _context.SaveChangesAsync();
        }
    }

    public async Task LogoutAsync(string? refreshToken)
    {
        if (!string.IsNullOrWhiteSpace(refreshToken))
            await _refreshTokenService.RevogarAsync(refreshToken);
    }
}
