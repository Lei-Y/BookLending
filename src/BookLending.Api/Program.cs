using BookLending.Domain;
using BookLending.Infrastructure;
using BookLending.Service;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// In-memory store is registered as singleton so seed data persists for the process lifetime.
// Swap this registration to a DB-backed IBookRepository when ready to persist.
builder.Services.AddSingleton<IBookRepository, InMemoryBookRepository>();
builder.Services.AddScoped<IBookService, BookService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "BookLending API";
        options.WithTheme(ScalarTheme.BluePlanet);
    });
}

using (var scope = app.Services.CreateScope())
{
    var repo = scope.ServiceProvider.GetRequiredService<IBookRepository>();
    if (!repo.GetAll().Any())
    {
        BookSeeder.Seed(repo);
    }
}

app.UseCors();
app.MapControllers();

app.Run();

public partial class Program;
