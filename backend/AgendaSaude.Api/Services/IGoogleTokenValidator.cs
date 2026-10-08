namespace AgendaSaude.Api.Services;

public record GoogleUserInfo(string GoogleId, string Nome, string Email);

public interface IGoogleTokenValidator
{
    Task<GoogleUserInfo?> ValidarIdTokenAsync(string idToken);
}