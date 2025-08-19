using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Dapper;
using Microsoft.Extensions.DependencyInjection;

public static class ApiHost
{
    public static async Task StartAsync()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            Args = Array.Empty<string>(),
            ContentRootPath = AppContext.BaseDirectory
        });

        // CORS για dev
        builder.Services.AddCors(opts =>
        {
            opts.AddPolicy("AllowLocal",
                p => p
                    // επιτρέπεις και 127.0.0.1:8080 και localhost:8080 και το WebView2 appassets
                    .WithOrigins(
                        "http://127.0.0.1:8080",
                        "http://localhost:8080",
                        "https://appassets"       // WebView2 scheme
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .SetPreflightMaxAge(TimeSpan.FromHours(12))
            );

            // ή αν θες full dev wildcard (προσωρινά μόνο για ανάπτυξη):
            opts.AddPolicy("AllowAllDev",
                p => p.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod());
        });

        builder.WebHost.UseKestrel().UseUrls("http://127.0.0.1:5059");

        var app = builder.Build();

        // Ενεργοποίησε ΕΝΑ από τα δύο:
        //app.UseCors("AllowLocal");
        app.UseCors("AllowAllDev"); // πιο χαλαρό για δοκιμές

        app.MapGet("/api/ping", () => Results.Ok(new { ok = true }));

        // ... τα υπόλοιπα endpoints σου (POST /api/images κ.λπ.)

        await app.RunAsync("http://127.0.0.1:5059");
    }
}