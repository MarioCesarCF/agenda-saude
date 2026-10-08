using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace AgendaSaude.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected bool TryGetConsultorioId(out Guid consultorioId)
        => Guid.TryParse(User.FindFirstValue("ConsultorioId"), out consultorioId);

    protected bool TryGetUsuarioId(out Guid usuarioId)
        => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out usuarioId);
}
