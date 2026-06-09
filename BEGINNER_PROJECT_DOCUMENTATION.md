# Daily Updates App - Beginner Guide

This document explains the project in beginner-friendly terms and shows how to add new pages or modules safely.

Use `PROJECT_GUIDE.md` when you need technical details about files, execution, database setup, SQL queries, and deployment notes. Use this guide when you want to understand the app step by step or extend it with new features.

## What This Project Is

Daily Updates App is a website built with ASP.NET Core MVC.

In simple terms:

- The browser shows pages created from `.cshtml` Razor files.
- Controllers receive requests from the browser.
- Models describe the data.
- Entity Framework Core saves and reads data from SQL Server LocalDB.
- ASP.NET Core Identity handles login, registration, logout, roles, and password reset.

This project does not use React. The UI is rendered by ASP.NET Core on the server.

## How The Main Parts Work Together

| Part | Folder/File | Simple Meaning |
| --- | --- | --- |
| Model | `Models` | Defines data fields and validation rules. |
| View | `Views` | Defines the HTML page shown in the browser. |
| Controller | `Controllers` | Handles browser requests and chooses what to do. |
| Layout | `Views/Shared/_Layout.cshtml` | Common page design, navigation, CSS, and footer. |
| Database context | `Models/ApplicationDbContext.cs` | Tells EF Core which tables exist. |
| Identity pages | `Areas/Identity/Pages/Account` | Login, register, forgot password, reset password. |
| Static files | `wwwroot` | Browser JavaScript and third-party libraries. |

## Recommended Learning Order

1. `DailyUpdatesApp.csproj` - .NET version and packages.
2. `appsettings.json` - database connection.
3. `Program.cs` - app startup, services, Identity, roles, database setup, and routes.
4. `Models/Employee.cs` - user information.
5. `Models/DailyUpdate.cs` - daily update information.
6. `Models/ApplicationDbContext.cs` - database table registration and relationships.
7. `Controllers/UpdateController.cs` - employee update actions.
8. `Controllers/AdminController.cs` - manager-only actions.
9. `Views/Update` and `Views/Admin` - UI pages connected to controllers.
10. `Areas/Identity/Pages/Account` - login and registration flow.

## MVC Naming Rules

ASP.NET Core MVC uses naming conventions.

If the controller is:

```text
ReportsController
```

Then views should go in:

```text
Views/Reports
```

If the action is:

```csharp
public IActionResult Index()
```

Then the matching view is:

```text
Views/Reports/Index.cshtml
```

The browser URL becomes:

```text
/Reports
```

or:

```text
/Reports/Index
```

## Before Adding Anything

Open PowerShell in the project folder:

```powershell
cd D:\DailyUpdatesApp\DailyUpdatesApp
```

Build before making changes:

```powershell
dotnet build
```

Run the project:

```powershell
dotnet run
```

Open the URL shown in the terminal.

## Add A Simple Page Without Database

Use this when a page only displays information and does not save records.

Example: add an `About` page.

### Step 1: Create A Controller

Create:

```text
Controllers/AboutController.cs
```

Add:

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

### Step 2: Create The View

Create this folder:

```text
Views/About
```

Create this file:

```text
Views/About/Index.cshtml
```

Add:

```cshtml
@{
    ViewData["Title"] = "About";
}

<div class="card">
    <h1>About Daily Updates App</h1>
    <p>This page explains the purpose of the application.</p>
</div>
```

### Step 3: Open The Page

Run the app and open:

```text
/About
```

### Step 4: Add Navigation

Open:

```text
Views/Shared/_Layout.cshtml
```

Add a link near the other navigation links:

```cshtml
<li>
    <a href="/About">About</a>
</li>
```

## Add A Page For Logged-In Users Only

Use `[Authorize]` when only logged-in users should access a page.

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

If a logged-out user opens `/Profile`, ASP.NET Core Identity redirects them to login.

## Add A Manager-Only Page

Use `[Authorize(Roles = "Manager")]` when only managers should access a page.

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

Create:

```text
Views/Reports/Index.cshtml
```

Open:

```text
/Reports
```

Only users in the `Manager` role can access it.

## Add A Full Database-Backed Module

Use this when the feature needs to save and read data from SQL Server.

Example module: `Announcements`

Managers can create announcements. Logged-in users can view announcements.

### Step 1: Create The Model

Create:

```text
Models/Announcement.cs
```

Add:

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
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
```

### Step 2: Register The Table

Open:

```text
Models/ApplicationDbContext.cs
```

Add this property inside the `ApplicationDbContext` class:

```csharp
public DbSet<Announcement> Announcements { get; set; }
```

If `DbSet` is not recognized, make sure this using exists at the top:

```csharp
using Microsoft.EntityFrameworkCore;
```

### Step 3: Create The Controller

Create:

```text
Controllers/AnnouncementsController.cs
```

Add:

```csharp
using DailyUpdatesApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DailyUpdatesApp.Controllers
{
    [Authorize]
    public class AnnouncementsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AnnouncementsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index(CancellationToken cancellationToken)
        {
            var announcements = await _context.Announcements
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

            _context.Announcements.Add(model);
            await _context.SaveChangesAsync(cancellationToken);

            return RedirectToAction(nameof(Index));
        }
    }
}
```

### Step 4: Create The List View

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

### Step 5: Create The Form View

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

### Step 6: Add Navigation

Open:

```text
Views/Shared/_Layout.cshtml
```

Inside the logged-in user navigation block, add:

```cshtml
<li>
    <a href="/Announcements">Announcements</a>
</li>
```

### Step 7: Handle The Database

This project currently uses:

```csharp
context.Database.EnsureCreatedAsync();
```

Important beginner note: `EnsureCreatedAsync()` creates the database only when it does not already exist. If you add a new model/table after the database already exists, the new table may not be created automatically.

Simple local development fix:

1. Open SQL Server Management Studio.
2. Connect to `(localdb)\MSSQLLocalDB`.
3. Delete `DailyUpdatesDB`.
4. Run the app again.

This deletes local users and test updates, so only do it when losing local data is acceptable.

Better long-term approach:

```powershell
dotnet tool install --global dotnet-ef
dotnet ef migrations add AddAnnouncements
dotnet ef database update
```

Before using migrations seriously, replace `EnsureCreatedAsync()` with a migration-based startup approach.

## How To Choose What To Build

| Requirement | Recommended Approach |
| --- | --- |
| Static page | Controller + View |
| Page needs login | Controller + View + `[Authorize]` |
| Page is manager-only | Controller + View + `[Authorize(Roles = "Manager")]` |
| Page saves data | Model + `DbSet` + Controller + Views |
| Page combines multiple data sources | Add a ViewModel under `Models/ViewModels` |
| Feature has reusable business logic | Add a service under `Services` |

## Best Practices

- Keep controllers focused on request handling.
- Move complex logic into services.
- Use `[Authorize]` for private pages.
- Use `[Authorize(Roles = "Manager")]` for manager-only pages.
- Use `[HttpPost]` on form submit actions.
- Use `[ValidateAntiForgeryToken]` and `@Html.AntiForgeryToken()` for forms.
- Use validation attributes such as `[Required]`, `[StringLength]`, and `[Range]`.
- Use `AsNoTracking()` for read-only EF Core queries.
- Use async database calls.
- Keep view folder names matching controller names.
- Use view models when a page needs more than one type of data.

## Common Mistakes

- Creating `ReportsController` but putting views under `Views/Report` instead of `Views/Reports`.
- Creating an action named `Create` but naming the view `Add.cshtml`.
- Forgetting to add a new `DbSet` in `ApplicationDbContext`.
- Forgetting `[HttpPost]` on submit actions.
- Forgetting anti-forgery validation on forms.
- Expecting `EnsureCreatedAsync()` to update an existing database schema.
- Forgetting to test as logged-out user, employee, and manager.

## Validation Checklist For A New Module

1. Run `dotnet build`.
2. Run `dotnet run`.
3. Open the new page URL.
4. Test as a logged-out user.
5. Test as an employee.
6. Test as a manager.
7. If the feature saves data, confirm the record appears in SQL Server.
8. Confirm restricted pages block unauthorized users.
9. Confirm navigation links work.
10. Confirm validation messages appear for invalid form input.
