using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;

namespace AgendaSaude.Api.Tests;

public static class TestHelper
{
    public static AppDbContext CreateInMemoryContext(string? dbName = null)
    {
        dbName ??= Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }
}
