# Adding Pages And Modules - Beginner Guide

This guide explains how to add a new page or a new module in this ASP.NET Core MVC project.

The project uses the MVC pattern:

| Part | Folder | Purpose |
| --- | --- | --- |
| Model | `Models` | Defines data and validation rules |
| View | `Views` | Defines the HTML UI shown in browser |
| Controller | `Controllers` | Receives browser requests and decides what to return |
| Layout/navigation | `Views/Shared/_Layout.cshtml` | Shared page design and menu links |
| Database context | `Models/ApplicationDbContext.cs` | Registers database tables used by Entity Framework |

## Important Naming Rule

ASP.NET Core MVC uses naming conventions.

If the controller is:

```text
ReportsController
```

Then its views should be placed in:

```text
Views/Reports
```

If the controller action is:

```csharp
public IActionResult Index()
```

Then the matching view file should be:

```text
Views/Reports/Index.cshtml
```

The browser URL becomes:

```text
/Reports/Index
```

For an action named `Create`, the URL becomes:

```text
/Reports/Create
```

## Before You Start

Open the project folder:

```powershell
cd D:\DailyUpdatesApp\DailyUpdatesApp
```

Build the project before making changes:

```powershell
dotnet build
```

Run the project:

```powershell
dotnet run
```

Use the local URL shown in the terminal, usually:

```text
https://localhost:5001
http://localhost:5000
```

## Option 1: Add A Simple Page Without Database

Use this when the page only displays information and does not save records.

Example: add an `About` page.

### Step 1: Create A Controller

Create this file:

```text
Controllers/AboutController.cs
```

Add this code:

```csharp
using Microsoft.AspNetCore.Mvc;

namespace DailyUpdatesApp.Controllers
{
    public class AboutController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
```

### Step 2: Create The View Folder

Create this folder:

```text
Views/About
```

### Step 3: Create The View

Create this file:

```text
Views/About/Index.cshtml
```

Add this code:

```cshtml
@{
    ViewData["Title"] = "About";
}

<div class="card">
    <h1>About Daily Updates App</h1>
    <p>This page explains the purpose of the application.</p>
</div>
```

### Step 4: Open The Page

Run the app and open:

```text
/About
```

or:

```text
/About/Index
```

### Step 5: Add A Navigation Link

Open:

```text
Views/Shared/_Layout.cshtml
```

Add this link inside the navigation area:

```cshtml
<li>
    <a href="/About">About</a>
</li>
```

Place it near the other navigation links.

## Option 2: Add A Page Only Logged-In Users Can Access

Use `[Authorize]` when only logged-in users should access a page.

Example:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DailyUpdatesApp.Controllers
{
    [Authorize]
    public class ProfileController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
```

This URL will require login:

```text
/Profile
```

If the user is not logged in, ASP.NET Core Identity redirects them to:

```text
/Identity/Account/Login
```

## Option 3: Add A Manager-Only Page

Use this when only managers should access the page.

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DailyUpdatesApp.Controllers
{
    [Authorize(Roles = "Manager")]
    public class ReportsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
```

Create the view:

```text
Views/Reports/Index.cshtml
```

Open:

```text
/Reports
```

Only users in the `Manager` role can access it.

## Option 4: Add A Full Database-Backed Module

Use this when the module needs to save and read data from SQL Server.

Example module: `Announcements`

Managers can create announcements. Logged-in users can view announcements.

### Step 1: Create The Model

Create this file:

```text
Models/Announcement.cs
```

Add this code:

```csharp
using System;
using System.ComponentModel.DataAnnotations;

namespace DailyUpdatesApp.Models
{
    public class Announcement
    {
        public int Id { get; set; }

        [Required]
        [StringLength(150)]
        public string Title { get; set; }

        [Required]
        public string Message { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
```

### Step 2: Register The Table In ApplicationDbContext

Open:

```text
Models/ApplicationDbContext.cs
```

Add this property inside the `ApplicationDbContext` class:

```csharp
public DbSet<Announcement> Announcements { get; set; }
```

The file should look like this in concept:

```csharp
public class ApplicationDbContext : IdentityDbContext<Employee>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<DailyUpdate> DailyUpdates { get; set; }
    public DbSet<Announcement> Announcements { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Existing DailyUpdate configuration stays here.
    }
}
```

### Step 3: Create The Controller

Create this file:

```text
Controllers/AnnouncementsController.cs
```

Add this code:

```csharp
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DailyUpdatesApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DailyUpdatesApp.Controllers
{
    [Authorize]
    public class AnnouncementsController : Controller
    {
        private readonly ApplicationDbContext _ctx;

        public AnnouncementsController(ApplicationDbContext ctx)
        {
            _ctx = ctx;
        }

        public async Task<IActionResult> Index(CancellationToken cancellationToken)
        {
            var announcements = await _ctx.Announcements
                .OrderByDescending(x => x.CreatedAt)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            return View(announcements);
        }

        [Authorize(Roles = "Manager")]
        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [Authorize(Roles = "Manager")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Announcement model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            _ctx.Announcements.Add(model);
            await _ctx.SaveChangesAsync(cancellationToken);

            return RedirectToAction(nameof(Index));
        }
    }
}
```

### Step 4: Create The Views Folder

Create:

```text
Views/Announcements
```

### Step 5: Create The List Page

Create:

```text
Views/Announcements/Index.cshtml
```

Add:

```cshtml
@model IEnumerable<DailyUpdatesApp.Models.Announcement>

<div class="card">
    <h1>Announcements</h1>

    @if (User.IsInRole("Manager"))
    {
        <div class="button-group">
            <a class="btn btn-primary" href="/Announcements/Create">Create Announcement</a>
        </div>
    }

    @if (!Model.Any())
    {
        <div class="alert alert-info mt-3">No announcements found.</div>
    }
    else
    {
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Created At</th>
                </tr>
            </thead>
            <tbody>
                @foreach (var item in Model)
                {
                    <tr>
                        <td>@item.Title</td>
                        <td>@item.Message</td>
                        <td>@item.CreatedAt.ToString("dd-MMM-yyyy HH:mm")</td>
                    </tr>
                }
            </tbody>
        </table>
    }
</div>
```

### Step 6: Create The Form Page

Create:

```text
Views/Announcements/Create.cshtml
```

Add:

```cshtml
@model DailyUpdatesApp.Models.Announcement

<div class="card">
    <h1>Create Announcement</h1>

    <form asp-action="Create" method="post">
        @Html.AntiForgeryToken()

        <div asp-validation-summary="ModelOnly" class="text-danger"></div>

        <div class="form-group">
            <label asp-for="Title"></label>
            <input asp-for="Title" class="form-control" />
            <span asp-validation-for="Title" class="text-danger"></span>
        </div>

        <div class="form-group">
            <label asp-for="Message"></label>
            <textarea asp-for="Message" class="form-control"></textarea>
            <span asp-validation-for="Message" class="text-danger"></span>
        </div>

        <div class="button-group">
            <button type="submit" class="btn btn-primary">Save</button>
            <a class="btn btn-secondary" href="/Announcements">Cancel</a>
        </div>
    </form>
</div>

@section Scripts {
    <partial name="_ValidationScriptsPartial" />
}
```

### Step 7: Add Navigation

Open:

```text
Views/Shared/_Layout.cshtml
```

Inside the authenticated-user navigation block, add:

```cshtml
<li>
    <a href="/Announcements">Announcements</a>
</li>
```

A good place is near:

```cshtml
<a href="/Update/MyUpdates">My Updates</a>
```

### Step 8: Run The App

```powershell
dotnet run
```

Open:

```text
/Announcements
```

Log in as manager and open:

```text
/Announcements/Create
```

## Important Database Note For This Project

This app currently uses:

```csharp
context.Database.EnsureCreatedAsync();
```

That creates the database automatically only when the database does not already exist.

Common beginner issue:

- If you add a new model/table after the database already exists, `EnsureCreatedAsync()` may not update the existing database schema.

Simple local-development fix:

1. Open SQL Server Management Studio.
2. Connect to:

```text
(localdb)\MSSQLLocalDB
```

3. Delete the local database:

```text
DailyUpdatesDB
```

4. Run the app again.

The app will recreate the database with the new table.

Important: deleting the database removes local users and updates. Only do this in local development when losing test data is acceptable.

Better long-term approach:

- Use Entity Framework Core migrations.
- Migrations update the database without deleting existing data.

## Basic EF Core Migration Flow

If you decide to use migrations later, the common flow is:

```powershell
dotnet ef migrations add AddAnnouncements
dotnet ef database update
```

If `dotnet ef` is not installed:

```powershell
dotnet tool install --global dotnet-ef
```

Before using migrations properly, replace `EnsureCreatedAsync()` with a migration-based startup approach. Do not mix `EnsureCreated` and migrations for the same database in serious environments.

## How To Decide What Type Of Page To Add

| Requirement | Recommended approach |
| --- | --- |
| Static information page | Controller + View |
| Page needs login | Controller + View + `[Authorize]` |
| Page only managers can see | Controller + View + `[Authorize(Roles = "Manager")]` |
| Page saves data | Model + DbSet + Controller + Views |
| Page needs dropdowns or combined data | Create a ViewModel under `Models/ViewModels` |
| Page needs reusable business logic | Add a service under `Services` |

## Best Practices

- Keep controllers small. Put complex business logic in services.
- Use `[Authorize]` on any page that should not be public.
- Use `[Authorize(Roles = "Manager")]` for manager-only modules.
- Use `[ValidateAntiForgeryToken]` on POST actions.
- Validate input using model attributes like `[Required]`, `[StringLength]`, and `[Range]`.
- Use `AsNoTracking()` for read-only queries.
- Use `CancellationToken` in async database actions, following the existing project style.
- Use view models when a page needs data from more than one model.
- Keep view folder names matching controller names.

## Common Mistakes

- Creating `ReportsController` but putting views under `Views/Report` instead of `Views/Reports`.
- Creating an action named `Create` but naming the view `Add.cshtml`.
- Forgetting to register a new database model as a `DbSet` in `ApplicationDbContext`.
- Forgetting to add `[HttpPost]` on form submit actions.
- Forgetting `@Html.AntiForgeryToken()` in forms.
- Forgetting to rebuild after adding new files.
- Adding a new model but expecting the existing database to update automatically while using `EnsureCreatedAsync()`.

## Validation Checklist For Any New Module

After adding a page or module:

1. Run:

```powershell
dotnet build
```

2. Run:

```powershell
dotnet run
```

3. Open the new page URL.
4. Test as a logged-out user.
5. Test as an employee.
6. Test as a manager.
7. If the module saves data, confirm the record appears in SQL Server.
8. Confirm unauthorized users cannot access restricted pages.
9. Check the navigation link works.
10. Check validation errors appear when required fields are empty.

