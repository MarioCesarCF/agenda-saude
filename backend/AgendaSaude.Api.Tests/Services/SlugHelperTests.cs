using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Tests.Services;

public class SlugHelperTests
{
    [Theory]
    [InlineData("Clínica Saúde", "clinica-saude")]
    [InlineData("  Odonto   Sorriso  ", "odonto-sorriso")]
    [InlineData("Dentista & Cia", "dentista-cia")]
    [InlineData("Órbita", "orbita")]
    public void Gerar_DeveNormalizarTexto(string entrada, string esperado)
    {
        Assert.Equal(esperado, SlugHelper.Gerar(entrada));
    }

    [Fact]
    public void Gerar_TextoVazio_DeveRetornarVazio()
    {
        Assert.Equal(string.Empty, SlugHelper.Gerar(null));
        Assert.Equal(string.Empty, SlugHelper.Gerar("   "));
    }

    [Theory]
    [InlineData("clinica-saude")]
    [InlineData("odonto123")]
    [InlineData("a1b2c3")]
    public void Valido_SlugCorreto_DeveRetornarTrue(string slug)
    {
        Assert.True(SlugHelper.Valido(slug));
    }

    [Theory]
    [InlineData("ab")]            // curto
    [InlineData("admin")]         // reservado
    [InlineData("p")]             // reservado
    [InlineData("Clinica")]       // maiúscula
    [InlineData("clinica--saude")] // hífen duplo
    [InlineData("-clinica")]      // hífen inicial
    [InlineData("clinica_")]      // caractere inválido
    [InlineData("")]
    public void Valido_SlugInvalido_DeveRetornarFalse(string slug)
    {
        Assert.False(SlugHelper.Valido(slug));
    }

    [Fact]
    public void Gerar_TextoLongo_DeveRespeitarTamanhoMaximo()
    {
        var slug = SlugHelper.Gerar(new string('a', 100));
        Assert.True(slug.Length <= SlugHelper.TamanhoMaximo);
        Assert.True(SlugHelper.Valido(slug));
    }
}
