using System.Net;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace AgendaSaude.Api.Services;

public class GoogleTokenValidator : IGoogleTokenValidator
{
    private const string MetadataEndpoint = "https://accounts.google.com/.well-known/openid-configuration";

    private readonly string _clientId;
    private readonly IConfigurationManager<OpenIdConnectConfiguration> _configurationManager;
    private readonly ILogger<GoogleTokenValidator> _logger;

    public GoogleTokenValidator(string clientId, ILogger<GoogleTokenValidator> logger)
    {
        _clientId = clientId;
        _logger = logger;

        _configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            MetadataEndpoint, new OpenIdConnectConfigurationRetriever());
    }

    public async Task<GoogleUserInfo?> ValidarIdTokenAsync(string idToken)
    {
        if (string.IsNullOrWhiteSpace(_clientId))
        {
            _logger.LogWarning(
                "Google:ClientId não configurada — login com Google indisponível. Defina 'Google:ClientId'.");
            return null;
        }

        try
        {
            var config = await _configurationManager.GetConfigurationAsync(CancellationToken.None);
            var handler = new JsonWebTokenHandler();

            var result = await handler.ValidateTokenAsync(idToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuers = ["https://accounts.google.com", "accounts.google.com"],
                ValidateAudience = true,
                ValidAudience = _clientId,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1),
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = config.SigningKeys,
                RequireSignedTokens = true
            });

            if (!result.IsValid)
            {
                _logger.LogWarning("ID token do Google inválido: {Erro}", result.Exception?.Message);
                _configurationManager.RequestRefresh();
                return null;
            }

            var subject = ObterClaim(result.Claims, "sub");
            var email = ObterClaim(result.Claims, "email");
            var nome = ObterClaim(result.Claims, "name");
            var emailVerificado = ObterClaim(result.Claims, "email_verified");

            if (string.IsNullOrWhiteSpace(subject) ||
                string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(nome) ||
                emailVerificado != "true")
            {
                _logger.LogWarning("ID token do Google sem claims esperados ou email não verificado.");
                return null;
            }

            return new GoogleUserInfo(
                subject,
                WebUtility.HtmlDecode(nome!),
                WebUtility.HtmlDecode(email!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao validar ID token do Google.");
            return null;
        }
    }

    private static string? ObterClaim(IDictionary<string, object> claims, string claimType)
    {
        if (!claims.TryGetValue(claimType, out var value) || value is null)
            return null;
        return value.ToString();
    }
}