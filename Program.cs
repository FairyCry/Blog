using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

var builder = WebApplication.CreateBuilder(args);

// Регистрируем DbContext
builder.Services.AddScoped<AppDbContext>();

// Настройка JSON (циклы)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();


using (var db = new AppDbContext())
{
    db.Database.EnsureCreated();
}

app.MapPost("/register", async (AppDbContext db, NamePasswordRequest data) =>
{
    bool exists = await db.Users.AnyAsync(u => u.Name == data.Name);
    if (exists) return Results.BadRequest("Пользователь с таким именем уже существует");

    var user = new User { Name = data.Name, Password = data.Password };
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok("Пользователь зарегистрирован");
});
app.MapGet("/getPosts", async (AppDbContext db) =>
{
    var Posts = await db.Posts
    .Include(p => p.User)
    .Include(p => p.Comments)
        .ThenInclude(c => c.User)
    .ToListAsync();
    Console.WriteLine(Posts.Count);
    Console.WriteLine("выдал посты");
    return Results.Json(Posts);
});
app.MapGet("thisUserIdIsExists", async (AppDbContext db, int id) =>
{
    var exists = await db.Users.AnyAsync(u => u.Id == id);
    Console.WriteLine(exists);
    return exists;
});
app.MapPost("/addPost", async (AppDbContext db, AddPostRequest request) =>
{
    Console.WriteLine("ок пока что все");
    var post = new Post
    {
        PostName = request.reqPostName,
        VisualContent = request.reqPostVisualContent,
        GlobalContent = request.reqPostGlobalContent,
        UserId = request.reqPostUserId
    };
    db.Posts.Add(post);
    await db.SaveChangesAsync();
    Console.WriteLine("Добавил");
    return Results.Ok();
});
app.MapGet("/getPost", async (AppDbContext db, int postId) =>
{
    Console.WriteLine($"значение для поиска id {postId}");

    var post = await db.Posts
    .Include(p => p.User)
    .Include(p => p.Comments)
    .ThenInclude(c => c.User)
    .FirstOrDefaultAsync(p => p.Id == postId);

    if (post == null)
    {
        return Results.NotFound();
    }
    Console.WriteLine(post.PostName);
    return Results.Json(post);
});
app.MapGet("/deletePost", async (AppDbContext db, int id) =>
{
    var post = await db.Posts.FirstOrDefaultAsync(p => p.Id == id);
    if (post != null)
    {
        db.Posts.Remove(post);
        await db.SaveChangesAsync();
        Console.WriteLine($"был удален пост, индекс: {post.Id}, название: {post.PostName} ");
        return Results.Ok("пост был удален");
    }
    else
    {
        return Results.NotFound("пост не найден");
    }
});
app.MapGet("/getUsers", async (AppDbContext db) =>
{
    var users = await db.Users.ToListAsync();
    return Results.Ok(users);
});
app.MapGet("/getAccount", async (AppDbContext db, int accountId) =>
{
    var User = await db.Users
    .Include(u => u.Posts)
    .ThenInclude(p => p.Comments)
    .Include(u => u.Comments)
    .FirstOrDefaultAsync(u => u.Id == accountId);
    if (User != null)
    {
        Console.WriteLine($"Даю юзера под Id {User.Id}");
        return Results.Json(User);
    }
    else
    {
        return Results.NotFound("Не наход");
    }
});
app.MapDelete("/deleteUser", async (AppDbContext db, int id) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
    if (user != null)
    {
        db.Users.Remove(user);
        await db.SaveChangesAsync();
        Console.WriteLine($"Удален пользователь под индексом {user.Id}");
        return Results.Ok("Удалено");
    }
    else
    {
        return Results.NotFound("не наход");
    }
});
app.MapPost("/addComment", async (AppDbContext db, CommentRequest request) =>
{
    var comment = new Comment
    {
        UserId = request.UserId,
        Content = request.CommentContent,
        PostId = request.PostId
    };
    db.Comments.Add(comment);
    await db.SaveChangesAsync();
    return Results.Ok();
});
app.Run();

public class NamePasswordRequest
{
    public string Name { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
public class CommentRequest
{
    public string CommentContent { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int PostId { get; set; }
}
public class AddPostRequest
{
    public string reqPostName { get; set; } = string.Empty;
    public string reqPostVisualContent { get; set; } = string.Empty;
    public string reqPostGlobalContent { get; set; } = string.Empty;
    public int reqPostUserId { get; set; }
}

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public List<Post> Posts { get; set; } = new();
    public List<Comment> Comments { get; set; } = new();
}

public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int PostId { get; set; }
    public Post Post { get; set; } = null!;
}

public class Post
{
    public int Id { get; set; }
    public string PostName { get; set; } = string.Empty;
    public string VisualContent { get; set; } = string.Empty;
    public string GlobalContent { get; set; } = string.Empty;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public List<Comment> Comments { get; set; } = new();
}

public class AppDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Post> Posts { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=blog.db");
}