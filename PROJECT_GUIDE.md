# Daily Updates App - Project Documentation

This document is the technical reference for the Daily Updates App. It explains the project structure, execution flow, database setup, authentication, important files, routes, and validation steps.

## Project Overview

Daily Updates App is an ASP.NET Core MVC application for tracking employee daily work updates.

Main workflows:

- Employees can register, log in, add daily updates, view their own updates, edit their own updates, and delete their own updates.
- Managers can log in, view team updates for a selected date, view employee-specific updates, view update details, and delete updates.
- Users, roles, and daily updates are stored in SQL Server LocalDB.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Runtime | .NET 9 |
| Web framework | ASP.NET Core MVC + Razor Pages |
| UI rendering | Razor `.cshtml` views |
| Authentication | ASP.NET Core Identity |
| Authorization | Role-based authorization |
| Database | SQL Server LocalDB |
| ORM | Entity Framework Core SQL Server |
| Client libraries | jQuery, jQuery Validation, Unobtrusive Validation |

This project does not use React, Angular, Vue, or a separate frontend application. HTML is generated on the server by Razor views and Razor Pages.

## Important Files And Folders

### Root Files

| File | Purpose |
| --- | --- |
| `DailyUpdatesApp.sln` | Visual Studio solution file. Opens the project in Visual Studio. |
| `DailyUpdatesApp.csproj` | Project configuration. Defines `.NET 9` and NuGet packages. |
| `Program.cs` | Application startup. Configures services, database, Identity, middleware, roles, seed user, and routes. |
| `appsettings.json` | App configuration, including the SQL Server LocalDB connection string. |
| `libman.json` | Frontend library manager configuration for browser libraries under `wwwroot/lib`. |
| `PROJECT_GUIDE.md` | Technical project documentation. |
| `BEGINNER_PROJECT_DOCUMENTATION.md` | Beginner guide for understanding and extending the project. |

### Controllers

Controllers receive browser requests, perform backend work, and return views or redirects.

| File | Purpose |
| --- | --- |
| `Controllers/HomeController.cs` | Handles the home page and summary data. |
| `Controllers/UpdateController.cs` | Handles employee daily update actions: add, edit, details, delete, and my updates. |
| `Controllers/AdminController.cs` | Handles manager-only dashboard and employee update pages. |

### Models

Models represent database entities and data passed to views.

| File | Purpose |
| --- | --- |
| `Models/ApplicationDbContext.cs` | EF Core database context. Registers Identity tables and `DailyUpdates`. |
| `Models/Employee.cs` | Application user model. Extends ASP.NET Core Identity user data. |
| `Models/DailyUpdate.cs` | Daily update database model. Stores ticket/update details. |
| `Models/ViewModels/HomeIndexViewModel.cs` | View model used by the home page. |

### Services

Services contain reusable backend logic that should not live directly in controllers.

| File | Purpose |
| --- | --- |
| `Services/IEmailSender.cs` | Email sender contract used by Identity/password reset flows. |
| `Services/EmailSender.cs` | SMTP email sender implementation. Logs/skips email if SMTP is not configured. |
| `Services/PasswordResetOtpService.cs` | Generates and validates OTP codes for password reset. |

### Views

Views are Razor `.cshtml` files that generate HTML.

| File/Folder | Purpose |
| --- | --- |
| `Views/_ViewStart.cshtml` | Sets the default layout for MVC views. |
| `Views/_ViewImports.cshtml` | Imports namespaces and Razor tag helpers. |
| `Views/Home/Index.cshtml` | Home page UI. |
| `Views/Update` | Employee update pages. |
| `Views/Admin` | Manager dashboard and detail pages. |
| `Views/Shared/_Layout.cshtml` | Shared page layout, navigation, common CSS, footer, and `@RenderBody()`. |
| `Views/Shared/_LoginPartial.cshtml` | Login/logout partial view. |
| `Views/Shared/_ValidationScriptsPartial.cshtml` | Client-side validation scripts partial. |

### Identity Pages

Identity pages are Razor Pages used for login, registration, logout, forgot password, reset password, and lockout screens.

| Folder | Purpose |
| --- | --- |
| `Areas/Identity/Pages` | Identity Razor Page configuration and shared files. |
| `Areas/Identity/Pages/Account` | Account-related UI pages and page models. |

Each `.cshtml` file contains the UI. Each matching `.cshtml.cs` file contains the backend page logic.

### Static Files

| Folder/File | Purpose |
| --- | --- |
| `wwwroot/js/password-toggle.js` | JavaScript for showing/hiding password fields. |
| `wwwroot/lib/jquery` | jQuery library. |
| `wwwroot/lib/jquery-validation` | Client-side validation library. |
| `wwwroot/lib/jquery-validation-unobtrusive` | ASP.NET Core unobtrusive validation integration. |

### Generated Folders

| Folder | Purpose |
| --- | --- |
| `bin` | Build output such as `.dll`, `.exe`, and runtime files. Do not edit manually. |
| `obj` | Intermediate build files generated by .NET. Do not edit manually. |
| `.git` | Git repository metadata. Do not edit manually. |
| `.config` | Local .NET/tool configuration. |
| `.idea` | JetBrains IDE settings. |

## Application Execution Flow

Typical request flow:

1. Browser sends a request, for example `/Update/MyUpdates`.
2. ASP.NET Core routing maps the URL to a controller action.
3. The controller checks authentication/authorization when required.
4. The controller reads or writes data using `ApplicationDbContext`.
5. Entity Framework Core communicates with SQL Server LocalDB.
6. The controller returns a Razor view.
7. Razor generates HTML and sends it to the browser.

Example update creation flow:

1. User opens `/Update/Add`.
2. `UpdateController` returns `Views/Update/Add.cshtml`.
3. User submits the form.
4. The POST action validates the input.
5. The controller creates a `DailyUpdate` record.
6. EF Core saves the record into `DailyUpdates`.
7. User is redirected to `/Update/MyUpdates`.

## Database Details

Connection string location: `appsettings.json`

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=DailyUpdatesDB;Trusted_Connection=True;"
}
```

| Item | Value |
| --- | --- |
| SQL Server instance | `(localdb)\MSSQLLocalDB` |
| Database name | `DailyUpdatesDB` |
| Authentication | Windows Authentication |
| SQL username/password | Not required |

The app creates the database on startup by using `EnsureCreatedAsync()`. This is simple for local development, but EF Core migrations are better for production or shared environments.

Main tables:

| Table | Purpose |
| --- | --- |
| `AspNetUsers` | Application users/employees. |
| `AspNetRoles` | Roles such as `Manager` and `Employee`. |
| `AspNetUserRoles` | User-to-role mappings. |
| `DailyUpdates` | Employee daily update records. |

## Startup Behavior

On startup, the app:

1. Creates the database if it does not exist.
2. Creates Identity tables if missing.
3. Creates the `Manager` and `Employee` roles if missing.
4. In Development environment only, creates a test manager account.

Development manager account:

| Field | Value |
| --- | --- |
| Email | `test@local` |
| Password | `P@ssw0rd!` |
| Role | `Manager` |

## Running The Application

Prerequisites:

1. .NET 9 SDK
2. SQL Server LocalDB
3. Visual Studio, Visual Studio Code, JetBrains Rider, or another .NET editor
4. SQL Server Management Studio or Azure Data Studio for database inspection

Run from PowerShell:

```powershell
cd D:\DailyUpdatesApp\DailyUpdatesApp
dotnet restore
dotnet build
dotnet run
```

Open the URL shown in the terminal. It is commonly:

```text
https://localhost:5001
http://localhost:5000
```

## Common Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Anyone | Home page |
| `/Identity/Account/Login` | Anyone | Login |
| `/Identity/Account/Register` | Anyone | Register employee account |
| `/Update/Add` | Logged-in users | Add daily update |
| `/Update/MyUpdates` | Logged-in users | View own updates |
| `/Admin/Dashboard` | Manager only | Manager dashboard |
| `/Admin/EmployeeUpdates/{id}` | Manager only | View one employee's updates |

## Database Inspection

Connect in SQL Server Management Studio:

```text
Server name: (localdb)\MSSQLLocalDB
Authentication: Windows Authentication
Database: DailyUpdatesDB
```

Useful SQL queries:

```sql
SELECT Id, Email, UserName, Name, Role, EmailConfirmed
FROM AspNetUsers
ORDER BY Email;
```

```sql
SELECT Id, Name
FROM AspNetRoles
ORDER BY Name;
```

```sql
SELECT
    u.Id,
    u.Email,
    u.Name,
    u.Role AS ProfileRole,
    r.Name AS IdentityRole
FROM AspNetUsers u
LEFT JOIN AspNetUserRoles ur ON ur.UserId = u.Id
LEFT JOIN AspNetRoles r ON r.Id = ur.RoleId
ORDER BY u.Email;
```

```sql
SELECT
    d.Id,
    d.Date,
    d.CreatedAt,
    u.Email AS EmployeeEmail,
    u.Name AS EmployeeName,
    d.Feature,
    d.TicketNumber,
    d.TicketDescription,
    d.Status,
    d.Blockers,
    d.EstimatedHours,
    d.EstimatedMinutes,
    d.EstimatedSeconds,
    d.HasETAChange,
    d.ETAChangeDescription
FROM DailyUpdates d
INNER JOIN AspNetUsers u ON u.Id = d.EmployeeId
ORDER BY d.CreatedAt DESC;
```

## Promote A User To Manager In Local Development

Prefer an application/admin workflow for role changes. For local development only, this SQL can promote a registered user:

```sql
DECLARE @Email nvarchar(256) = 'user@example.com';
DECLARE @UserId nvarchar(450);
DECLARE @ManagerRoleId nvarchar(450);

SELECT @UserId = Id
FROM AspNetUsers
WHERE Email = @Email;

SELECT @ManagerRoleId = Id
FROM AspNetRoles
WHERE Name = 'Manager';

IF @UserId IS NOT NULL
   AND @ManagerRoleId IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM AspNetUserRoles
       WHERE UserId = @UserId AND RoleId = @ManagerRoleId
   )
BEGIN
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    VALUES (@UserId, @ManagerRoleId);

    UPDATE AspNetUsers
    SET Role = 'Manager'
    WHERE Id = @UserId;
END;
```

After changing roles directly in SQL, log out and log back in.

## Password Reset And Email

The app includes a forgot-password flow using OTP.

Email configuration is optional for local development. If SMTP settings are not configured, the email sender logs/skips sending instead of failing the full app.

Optional configuration shape:

```json
"Email": {
  "From": "sender@example.com",
  "Smtp": {
    "Host": "smtp.example.com",
    "Port": "587",
    "EnableSsl": "true",
    "Username": "smtp-user",
    "Password": "smtp-password"
  }
}
```

Do not commit real production SMTP passwords or production connection strings.

## Validation Checklist

1. Run `dotnet restore`.
2. Run `dotnet build`.
3. Run `dotnet run`.
4. Confirm `DailyUpdatesDB` exists in SQL Server LocalDB.
5. Log in as manager with `test@local` / `P@ssw0rd!`.
6. Confirm `/Admin/Dashboard` opens for the manager.
7. Register a new employee.
8. Add an update as the employee.
9. Confirm the employee sees the update in `/Update/MyUpdates`.
10. Confirm the manager sees the update in `/Admin/Dashboard`.
11. Confirm the record exists in SQL Server table `DailyUpdates`.

## Common Pitfalls

- LocalDB must be installed and the server name must be exactly `(localdb)\MSSQLLocalDB`.
- The seeded manager account is created only in Development environment.
- If a role is changed directly in SQL, the user must log out and log back in.
- `EnsureCreatedAsync()` does not update an existing database schema after adding new models.
- Do not mix `EnsureCreatedAsync()` and EF Core migrations for the same serious/shared database.
- Do not store production secrets in `appsettings.json`.

## Production Readiness Notes

Before publishing this app:

1. Remove or change the seeded test manager account.
2. Move secrets to user secrets, environment variables, or a secure secret store.
3. Use a production SQL Server connection string.
4. Use HTTPS in the hosting environment.
5. Add an admin screen for user and role management.
6. Replace `EnsureCreatedAsync()` with EF Core migrations.
7. Add automated tests for authentication, authorization, and update workflows.
