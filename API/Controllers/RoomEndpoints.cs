using academy_API.DTOs;
using academy_API.Models;
using academy_API.Repositories;
using academy_API.Utilities;
using Microsoft.AspNetCore.Authorization;

namespace academy_API.Controllers;

public static class RoomEndpoints
{
    public static IEndpointRouteBuilder MapRoomEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/rooms").WithTags("Rooms").WithOpenApi()
            .RequireAuthorization(new AuthorizeAttribute { Roles = "admin" });

        group.MapGet("/", async (IRoomRepository repository, CancellationToken ct) => Results.Ok(await repository.ListAsync(ct)));

        group.MapPost("/", async (CreateRoomRequest request, HttpContext context, IRoomRepository repository, CancellationToken ct) =>
        {
            var instituteId = context.GetInstituteId();
            var name = request.Name?.Trim();
            if (instituteId is null) return Results.BadRequest(new { error = "Institute not identified." });
            if (string.IsNullOrWhiteSpace(name)) return Results.BadRequest(new { error = "Room name is required." });
            if (await repository.ExistsByNameAsync(name, ct: ct)) return Results.Conflict(new { error = "Room name already exists." });
            var now = DateTime.UtcNow;
            var room = await repository.CreateAsync(new Room { InstituteId = instituteId.Value, Name = name, Description = request.Description?.Trim(), IsActive = request.IsActive, CreatedAt = now, UpdatedAt = now }, ct);
            return Results.Created($"/api/rooms/{room.Id}", room);
        });

        group.MapPut("/{id:int}", async (int id, UpdateRoomRequest request, IRoomRepository repository, CancellationToken ct) =>
        {
            var name = request.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name)) return Results.BadRequest(new { error = "Room name is required." });
            if (await repository.ExistsByNameAsync(name, id, ct)) return Results.Conflict(new { error = "Room name already exists." });
            var room = await repository.UpdateAsync(id, name, request.Description?.Trim(), request.IsActive, ct);
            return room is null ? Results.NotFound() : Results.Ok(room);
        });

        group.MapDelete("/{id:int}", async (int id, IRoomRepository repository, CancellationToken ct) =>
            await repository.DeleteAsync(id, ct) ? Results.NoContent() : Results.NotFound());

        return app;
    }
}
