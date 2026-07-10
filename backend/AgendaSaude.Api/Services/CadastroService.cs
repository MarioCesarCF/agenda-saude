using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;

namespace AgendaSaude.Api.Services;

public class CadastroService
{
    private readonly AppDbContext _context;

    public CadastroService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ProfissionalResponse> CriarProfissionalAsync(Guid consultorioId, ProfissionalRequest request)
    {
        var profissional = new Profissional
        {
            ConsultorioId = consultorioId,
            Nome = request.Nome,
            TelefoneCelular = request.TelefoneCelular,
            Email = request.Email,
            Especialidade = request.Especialidade,
            RegistroProfissional = request.RegistroProfissional
        };
        _context.Profissionais.Add(profissional);
        await _context.SaveChangesAsync();

        return new ProfissionalResponse(profissional.Id, profissional.Nome,
            profissional.Especialidade, profissional.RegistroProfissional);
    }

    public async Task<List<ProfissionalResponse>> ListarProfissionaisAsync(Guid consultorioId, Guid? servicoId = null)
    {
        var query = _context.Profissionais
            .Where(p => p.ConsultorioId == consultorioId && p.Ativo);

        if (servicoId.HasValue)
            query = query.Where(p => p.ProfissionaisServicos.Any(ps => ps.ServicoId == servicoId.Value));

        return await query
            .Select(p => new ProfissionalResponse(p.Id, p.Nome,
                p.Especialidade, p.RegistroProfissional))
            .ToListAsync();
    }

    public async Task<List<ServicoResponse>> ListarServicosAsync(Guid consultorioId, Guid? profissionalId = null)
    {
        var query = _context.Servicos
            .Where(s => s.ConsultorioId == consultorioId && s.Ativo);

        if (profissionalId.HasValue)
            query = query.Where(s => s.SemProfissional || s.ProfissionaisServicos.Any(ps => ps.ProfissionalId == profissionalId.Value));

        return await query
            .Select(s => new ServicoResponse(s.Id, s.Nome, s.Descricao,
                s.DuracaoMinutos, s.Preco, s.Cor, s.SemProfissional))
            .ToListAsync();
    }

    public async Task<ServicoResponse> CriarServicoAsync(Guid consultorioId, ServicoRequest request)
    {
        var servico = new Servico
        {
            ConsultorioId = consultorioId,
            Nome = request.Nome,
            Descricao = request.Descricao,
            DuracaoMinutos = request.DuracaoMinutos,
            Preco = request.Preco,
            Cor = request.Cor,
            SemProfissional = request.SemProfissional
        };
        _context.Servicos.Add(servico);
        await _context.SaveChangesAsync();

        return new ServicoResponse(servico.Id, servico.Nome, servico.Descricao,
            servico.DuracaoMinutos, servico.Preco, servico.Cor, servico.SemProfissional);
    }

    public async Task<List<ServicoResponse>> ListarServicosAsync(Guid consultorioId)
    {
        return await _context.Servicos
            .Where(s => s.ConsultorioId == consultorioId && s.Ativo)
            .Select(s => new ServicoResponse(s.Id, s.Nome, s.Descricao,
                s.DuracaoMinutos, s.Preco, s.Cor, s.SemProfissional))
            .ToListAsync();
    }

    public async Task<CadastroPacienteResponse> CriarOuBuscarPacienteAsync(
        Guid consultorioId, string nome, string? email, string telefone)
    {
        Paciente? existente = null;

        if (!string.IsNullOrWhiteSpace(email))
        {
            existente = await _context.Pacientes
                .FirstOrDefaultAsync(p => p.Email == email && p.ConsultorioId == consultorioId);
        }

        existente ??= await _context.Pacientes
            .FirstOrDefaultAsync(p => p.Nome == nome && p.TelefoneCelular == telefone && p.ConsultorioId == consultorioId);

        if (existente is not null)
            return new CadastroPacienteResponse(existente.Id, existente.Nome, existente.Email);

        var paciente = new Paciente
        {
            ConsultorioId = consultorioId,
            Nome = nome,
            Email = email,
            TelefoneCelular = telefone,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(telefone)
        };

        _context.Pacientes.Add(paciente);
        await _context.SaveChangesAsync();

        return new CadastroPacienteResponse(paciente.Id, paciente.Nome, paciente.Email);
    }

    public async Task<CadastroPacienteResponse?> CriarPacienteCompletoAsync(
        Guid consultorioId, PacienteCompletoRequest request)
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
            CPF = request.CPF,
            DataNascimento = request.DataNascimento,
            Logradouro = request.Logradouro,
            Numero = request.Numero,
            Complemento = request.Complemento,
            Bairro = request.Bairro,
            Cidade = request.Cidade,
            Estado = request.Estado,
            CEP = request.CEP
        };

        _context.Pacientes.Add(paciente);
        await _context.SaveChangesAsync();

        return new CadastroPacienteResponse(paciente.Id, paciente.Nome, paciente.Email!);
    }

    public async Task<ProfissionalResponse?> AtualizarProfissionalAsync(Guid consultorioId, Guid id, ProfissionalRequest request)
    {
        var profissional = await _context.Profissionais
            .FirstOrDefaultAsync(p => p.Id == id && p.ConsultorioId == consultorioId);
        if (profissional is null) return null;

        profissional.Nome = request.Nome;
        profissional.TelefoneCelular = request.TelefoneCelular;
        profissional.Email = request.Email;
        profissional.Especialidade = request.Especialidade;
        profissional.RegistroProfissional = request.RegistroProfissional;

        await _context.SaveChangesAsync();

        return new ProfissionalResponse(profissional.Id, profissional.Nome,
            profissional.Especialidade, profissional.RegistroProfissional);
    }

    public async Task<bool> ExcluirProfissionalAsync(Guid consultorioId, Guid id)
    {
        var profissional = await _context.Profissionais
            .FirstOrDefaultAsync(p => p.Id == id && p.ConsultorioId == consultorioId);
        if (profissional is null) return false;

        profissional.Ativo = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ServicoResponse?> AtualizarServicoAsync(Guid consultorioId, Guid id, ServicoRequest request)
    {
        var servico = await _context.Servicos
            .FirstOrDefaultAsync(s => s.Id == id && s.ConsultorioId == consultorioId);
        if (servico is null) return null;

        servico.Nome = request.Nome;
        servico.Descricao = request.Descricao;
        servico.DuracaoMinutos = request.DuracaoMinutos;
        servico.Preco = request.Preco;
        servico.Cor = request.Cor;
        servico.SemProfissional = request.SemProfissional;

        await _context.SaveChangesAsync();

        return new ServicoResponse(servico.Id, servico.Nome, servico.Descricao,
            servico.DuracaoMinutos, servico.Preco, servico.Cor, servico.SemProfissional);
    }

    public async Task<bool> ExcluirServicoAsync(Guid consultorioId, Guid id)
    {
        var servico = await _context.Servicos
            .FirstOrDefaultAsync(s => s.Id == id && s.ConsultorioId == consultorioId);
        if (servico is null) return false;

        servico.Ativo = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ConfiguracaoResponse?> ObterConfiguracaoAsync(Guid consultorioId)
    {
        return await _context.Consultorios
            .Where(c => c.Id == consultorioId)
            .Select(c => new ConfiguracaoResponse(
                c.NomeFantasia, c.Email, c.Documento, c.TelefoneCelular,
                c.Logradouro, c.Numero, c.Bairro, c.Cidade, c.Estado, c.CEP,
                c.Tema, c.CorPrimaria, c.CorSecundaria, c.CorDestaque, c.Icone,
                c.DiasAgenda))
            .FirstOrDefaultAsync();
    }

    public async Task<bool> AtualizarConfiguracaoAsync(Guid consultorioId, ConfiguracaoUpdateRequest request)
    {
        var consultorio = await _context.Consultorios
            .FirstOrDefaultAsync(c => c.Id == consultorioId);
        if (consultorio is null) return false;

        if (request.NomeFantasia is not null) consultorio.NomeFantasia = request.NomeFantasia;
        if (request.Tema is not null) consultorio.Tema = request.Tema;
        if (request.CorPrimaria is not null) consultorio.CorPrimaria = request.CorPrimaria;
        if (request.CorSecundaria is not null) consultorio.CorSecundaria = request.CorSecundaria;
        if (request.CorDestaque is not null) consultorio.CorDestaque = request.CorDestaque;
        if (request.Icone is not null) consultorio.Icone = request.Icone;
        if (request.DiasAgenda.HasValue) consultorio.DiasAgenda = request.DiasAgenda.Value;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CriarHorarioAsync(Guid consultorioId, HorarioDisponivelRequest request)
    {
        if (!TimeSpan.TryParse(request.HoraInicio, out var inicio) ||
            !TimeSpan.TryParse(request.HoraFim, out var fim))
            return false;

        var horario = new HorarioDisponivel
        {
            ConsultorioId = consultorioId,
            ProfissionalId = request.ProfissionalId,
            ServicoId = request.ServicoId,
            DiaSemana = (DayOfWeek)request.DiaSemana,
            HoraInicio = inicio,
            HoraFim = fim
        };

        _context.HorariosDisponiveis.Add(horario);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<HorarioDisponivelResponse>> ListarHorariosAsync(Guid consultorioId)
    {
        return await _context.HorariosDisponiveis
            .Where(h => h.ConsultorioId == consultorioId && h.Ativo)
            .Select(h => new HorarioDisponivelResponse(
                h.Id, h.ProfissionalId,
                h.Profissional != null ? h.Profissional.Nome : null,
                h.ServicoId,
                h.Servico != null ? h.Servico.Nome : null,
                (int)h.DiaSemana, h.HoraInicio.ToString(@"hh\:mm"), h.HoraFim.ToString(@"hh\:mm")))
            .ToListAsync();
    }

    public async Task<bool> ExcluirHorarioAsync(Guid consultorioId, Guid id)
    {
        var horario = await _context.HorariosDisponiveis
            .FirstOrDefaultAsync(h => h.Id == id && h.ConsultorioId == consultorioId);
        if (horario is null) return false;

        horario.Ativo = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CriarBloqueioAsync(Guid consultorioId, BloqueioAgendaRequest request)
    {
        var bloqueio = new BloqueioAgenda
        {
            ConsultorioId = consultorioId,
            ProfissionalId = request.ProfissionalId,
            DataInicio = request.DataInicio,
            DataFim = request.DataFim,
            Motivo = request.Motivo
        };

        _context.BloqueiosAgenda.Add(bloqueio);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ProfissionalServicoResponse>> ListarVinculosAsync(Guid consultorioId)
    {
        return await _context.ProfissionaisServicos
            .Where(ps => ps.Profissional.ConsultorioId == consultorioId)
            .Select(ps => new ProfissionalServicoResponse(ps.ProfissionalId, ps.ServicoId))
            .ToListAsync();
    }

    public async Task<bool> VincularServicoAsync(Guid consultorioId, VincularServicoRequest request)
    {
        var profissional = await _context.Profissionais
            .AnyAsync(p => p.Id == request.ProfissionalId && p.ConsultorioId == consultorioId);
        if (!profissional) return false;

        var servico = await _context.Servicos
            .AnyAsync(s => s.Id == request.ServicoId && s.ConsultorioId == consultorioId);
        if (!servico) return false;

        var existente = await _context.ProfissionaisServicos
            .AnyAsync(ps => ps.ProfissionalId == request.ProfissionalId && ps.ServicoId == request.ServicoId);
        if (existente) return false;

        _context.ProfissionaisServicos.Add(new ProfissionalServico
        {
            ProfissionalId = request.ProfissionalId,
            ServicoId = request.ServicoId
        });
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DesvincularServicoAsync(Guid consultorioId, VincularServicoRequest request)
    {
        var vinculo = await _context.ProfissionaisServicos
            .FirstOrDefaultAsync(ps => ps.ProfissionalId == request.ProfissionalId
                && ps.ServicoId == request.ServicoId
                && ps.Profissional.ConsultorioId == consultorioId);
        if (vinculo is null) return false;

        _context.ProfissionaisServicos.Remove(vinculo);
        await _context.SaveChangesAsync();
        return true;
    }
}
