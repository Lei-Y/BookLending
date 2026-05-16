using BookLending.Domain;
using BookLending.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BookLending.IntegrationTests;

/// <summary>
/// Spins up the real ASP.NET host but replaces the singleton repository
/// with a fresh in-memory instance. Uses the "Testing" environment so
/// <c>Program.cs</c> skips the seed step. Exposes <see cref="ResetState"/>
/// so each test starts from a known-empty repository.
/// </summary>
public class IsolatedFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IBookRepository>();
            services.AddSingleton<IBookRepository, InMemoryBookRepository>();
        });
    }

    public void ResetState()
    {
        using var scope = Services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IBookRepository>();
        foreach (var book in repo.GetAll().ToList())
        {
            repo.Delete(book.Id);
        }
    }
}
