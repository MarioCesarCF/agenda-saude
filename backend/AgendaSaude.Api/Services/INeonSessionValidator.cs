namespace AgendaSaude.Api.Services;

public record NeonUserInfo(string GoogleId, string Nome, string Email);

public interface INeonSessionValidator
{
    Task<NeonUserInfo?> ValidarSessionTokenAsync(string sessionToken);
}