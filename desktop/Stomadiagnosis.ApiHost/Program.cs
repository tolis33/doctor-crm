// Program.cs  (.NET 9 minimal API)
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddSingleton<IWebHostEnvironment>(builder.Environment);

// CORS: επιτρέπει όλα τα origins για development
builder.Services.AddCors(o => o.AddPolicy("dev", p => p
    .AllowAnyOrigin()
    .AllowAnyHeader()
    .AllowAnyMethod()
));

// Configure API behavior options for model validation
builder.Services.AddControllers().ConfigureApiBehaviorOptions(options => {
    options.InvalidModelStateResponseFactory = context =>
        new BadRequestObjectResult(context.ModelState);
});

// Εναλλακτικά, για production μπορείς να χρησιμοποιήσεις:
// builder.Services.AddCors(o => o.AddPolicy("dev", p => p
//     .WithOrigins("http://127.0.0.1:8080","http://localhost:8080","https://appassets")
//     .AllowAnyHeader()
//     .AllowAnyMethod()
// ));

builder.WebHost.ConfigureKestrel(o => {
    o.Limits.MaxRequestBodySize = 200 * 1024 * 1024; // 200MB uploads
});

var app = builder.Build();
app.UseCors("dev");

// Απλά data paths
var dataDir = Path.Combine(AppContext.BaseDirectory, "data");
var imgDir  = Path.Combine(dataDir, "images");
Directory.CreateDirectory(imgDir);
var dbPath  = Path.Combine(dataDir, "images.json");
var db = File.Exists(dbPath)
    ? JsonSerializer.Deserialize<List<ImageRecord>>(File.ReadAllText(dbPath)) ?? new()
    : new List<ImageRecord>();

// Annotations data
var annPath = Path.Combine(dataDir, "annotations.json");
var annotations = File.Exists(annPath)
    ? JsonSerializer.Deserialize<List<AnnotationRecord>>(File.ReadAllText(annPath)) ?? new()
    : new List<AnnotationRecord>();

app.MapGet("/api/ping", () => Results.Ok(new { ok = true, time = DateTime.UtcNow }));

app.MapGet("/api/images", (int? patientId) =>
{
    var q = db.AsEnumerable();
    if (patientId is int pid) q = q.Where(x => x.PatientId == pid);
    return Results.Ok(q);
});

app.MapGet("/api/images/{id}", (string id) =>
{
    // Αν έχεις ΒΔ:
    // var rec = db.Images.FirstOrDefault(x => x.Id.ToString()==id || x.ClientId==id);
    // if (rec is null) return Results.NotFound();

    // Stub για έλεγχο:
    return Results.Json(new {
        ok = true,
        id,
        url = "/images/sample.jpg",
        mime = "image/jpeg"
    });
});

app.MapGet("/media/{file}", (string file) =>
{
    var abs = Path.Combine(imgDir, file);
    if (!File.Exists(abs)) return Results.NotFound();
    var contentType = "image/png"; // μπορείς να βάλεις ανίχνευση τύπου
    return Results.File(abs, contentType);
});

// === POST /api/images endpoint (handles FormData uploads) ===
app.MapPost("/api/images", async (HttpRequest req) =>
{
    try
    {
        if (!req.HasFormContentType)
        {
            Console.WriteLine("ERROR: Request is not FormData");
            return Results.BadRequest(new { error = "Expected multipart/form-data" });
        }

        var form = await req.ReadFormAsync();
        var file = form.Files["file"];
        var dataJson = form["data"].ToString();

        Console.WriteLine($"Received file: {file?.FileName}, size: {file?.Length} bytes");
        Console.WriteLine($"Received data: {dataJson}");

        if (file == null || file.Length == 0)
        {
            Console.WriteLine("ERROR: No file uploaded");
            return Results.BadRequest(new { error = "No file uploaded" });
        }

        // Save the uploaded file
        var id = Guid.NewGuid();
        var fileName = $"{id}_{file.FileName}";
        var filePath = Path.Combine(imgDir, fileName);
        
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        Console.WriteLine($"File saved to: {filePath}");

        return Results.Created($"/api/images/{id}", new {
            ok = true, 
            id,
            url = $"/media/{fileName}",
            mime = file.ContentType,
            filename = file.FileName,
            size = file.Length
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"ERROR in /api/images: {ex.Message}");
        return Results.Problem($"Upload failed: {ex.Message}");
    }
});

// === ANNOTATION ENDPOINTS ===
app.MapGet("/api/annotations", (Guid? imageId) =>
{
    var q = annotations.AsEnumerable();
    if (imageId is Guid gid) q = q.Where(a => a.ImageId == gid);
    return Results.Ok(q);
});

app.MapPost("/api/annotations", async (HttpRequest request) =>
{
    using var sr = new StreamReader(request.Body);
    var raw = await sr.ReadToEndAsync();
    if (string.IsNullOrWhiteSpace(raw)) return Results.BadRequest(new { error="Empty body" });

    AnnotationDto? dto;
    try {
        dto = JsonSerializer.Deserialize<AnnotationDto>(raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    } catch (Exception ex) {
        return Results.BadRequest(new { error = "Invalid JSON", detail = ex.Message });
    }
    if (dto is null) return Results.BadRequest(new { error="Invalid body" });

    var rec = new AnnotationRecord {
        Id = Guid.NewGuid(),
        ImageId = dto.ImageId,
        Kind = dto.Kind ?? "note",
        Data = dto.Data ?? new(),
        CreatedAt = DateTime.UtcNow
    };
    annotations.Add(rec);
    File.WriteAllText(annPath, JsonSerializer.Serialize(annotations, new JsonSerializerOptions { WriteIndented = true }));
    return Results.Created($"/api/annotations/{rec.Id}", rec);
});

app.Run("http://127.0.0.1:5059");

// helper για data URLs
static (byte[] bytes, string mime) ParseDataUrl(string dataUrl)
{
    var comma = dataUrl.IndexOf(',');
    if (comma < 0) return (Array.Empty<byte>(), "image/jpeg");
    var meta = dataUrl.Substring(0, comma);
    var b64  = dataUrl.Substring(comma + 1);
    var mime = "image/jpeg";
    var match = System.Text.RegularExpressions.Regex.Match(meta, @"data:(?<m>[^;]+);base64");
    if (match.Success) mime = match.Groups["m"].Value;
    return (Convert.FromBase64String(b64), mime);
}

// ====== DTOs / Records ======
public record CreateImageDto(
    string? ClientId,
    string? Name,
    string? Mime,
    int? Width,
    int? Height,
    string? Url,        // αν ήδη υπάρχει κάπου public url
    string? DataUrl,    // data:image/*;base64,...
    string? PatientId
);

public record ImageRec(
    Guid Id,
    string? ClientId,
    string? Name,
    string? Mime,
    int? Width,
    int? Height,
    string Url,
    string? PatientId,
    DateTime CreatedUtc
);

// Legacy ImageRecord για backward compatibility
public record ImageRecord {
    public Guid Id { get; set; }
    public int PatientId { get; set; }
    public string FileName { get; set; } = "";
    public string Type { get; set; } = "";
    public long Size { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Path { get; set; } = "";
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? Notes { get; set; }
}

// Annotation Records / DTOs
public record AnnotationRecord {
    public Guid Id { get; set; }
    public Guid ImageId { get; set; }
    public string Kind { get; set; } = "note";
    public Dictionary<string, object> Data { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public record AnnotationDto {
    public Guid ImageId { get; set; }
    public string? Kind { get; set; }
    public Dictionary<string, object>? Data { get; set; }
}