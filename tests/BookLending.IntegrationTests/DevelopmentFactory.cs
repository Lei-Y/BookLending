using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace BookLending.IntegrationTests;

/// <summary>
/// A second factory that runs the host in the real "Development" environment
/// without overriding the repository. This exercises the production startup
/// path: the OpenAPI / Scalar endpoints are mapped, and <c>Program.cs</c>
/// seeds the in-memory repository on first request.
/// </summary>
public class DevelopmentFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
    }
}
