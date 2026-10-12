using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace AgendaSaude.Api.Services;

public static partial class SlugHelper
{
    public const int TamanhoMinimo = 3;
    public const int TamanhoMaximo = 60;

    private static readonly HashSet<string> Reservados = new(StringComparer.OrdinalIgnoreCase)
    {
        "admin", "api", "login", "logout", "publico", "p", "cadastros",
        "usuarios", "agendamento", "pacientes", "auth", "configuracao",
        "esqueci-senha", "resetar-senha", "entrar", "minha-agenda"
    };

    public static string Gerar(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto)) return string.Empty;

        var normalizado = texto.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalizado.Length);

        foreach (var c in normalizado)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
                continue;

            if (char.IsLetterOrDigit(c))
                sb.Append(char.ToLowerInvariant(c));
            else
                sb.Append('-');
        }

        var slug = DashesRegex().Replace(sb.ToString(), "-").Trim('-');

        if (slug.Length > TamanhoMaximo)
            slug = slug[..TamanhoMaximo].Trim('-');

        return slug;
    }

    public static bool Valido(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return false;
        return slug.Length is >= TamanhoMinimo and <= TamanhoMaximo
            && FormatRegex().IsMatch(slug)
            && !Reservados.Contains(slug);
    }

    [GeneratedRegex("-+")]
    private static partial Regex DashesRegex();

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex FormatRegex();
}
