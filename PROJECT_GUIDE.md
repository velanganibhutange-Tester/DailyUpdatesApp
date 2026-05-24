# Daily Updates App - Project Guide

This guide explains how to run the Daily Updates App locally, log in as a manager or employee, and access the SQL Server database used by the application.

## Project Overview

Daily Updates App is an ASP.NET Core MVC application with ASP.NET Core Identity authentication.

Main features:
- Employees can register, log in, add daily work updates, view their own updates, edit updates, and delete their own updates.
- Managers can log in, view team updates for a selected date, view employee-specific updates, view update details, and delete updates.
- User accounts and daily updates are stored in SQL Server LocalDB.

## Technology Stack

- .NET: `net9.0`
- Framework: ASP.NET Core MVC + Razor Pages
- Authentication: ASP.NET Core Identity
- Database: SQL Server LocalDB
- ORM: Entity Framework Core SQL Server

## Prerequisites

Install these before running the app:

1. .NET 9 SDK
2. SQL Server LocalDB
3. Visual Studio 2022, Visual Studio Code, or another .NET-compatible editor
4. SQL Server Management Studio, Azure Data Studio, or another SQL client if you want to inspect the database manually

Validate your .NET installation:

```powershell
dotnet --version
```

The version should be `9.x`.

## Project Location

Current project folder:

```text
D:\DailyUpdatesApp\DailyUpdatesApp
```

Solution file:

```text
DailyUpdatesApp.sln
```

Project file:

```text
DailyUpdatesApp.csproj
```

## Database Configuration

The active database connection string is in `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=DailyUpdatesDB;Trusted_Connection=True;"
}
```

Database details:

| Item | Value |
| --- | --- |
| SQL Server instance | `(localdb)\MSSQLLocalDB` |
| Database name | `DailyUpdatesDB` |
| Authentication | Windows Authentication |
| SQL username | Not required |
| SQL password | Not required |

Because this uses Windows Authentication, the app connects using the currently signed-in Windows user.

## How To Run The Application

Open PowerShell in the project folder:

```powershell
cd D:\DailyUpdatesApp\DailyUpdatesApp
```

Restore dependencies:

```powershell
dotnet restore
```

Build the project:

```powershell
dotnet build
```

Run the app:

```powershell
dotnet run
```

After the app starts, the terminal will show the local URL. It is usually one of these:

```text
https://localhost:5001
http://localhost:5000
```

Open the shown URL in a browser.

## First Startup Behavior

On startup, the app automatically:

1. Creates the database if it does not already exist.
2. Creates the required Identity tables.
3. Creates these roles if missing:
   - `Manager`
   - `Employee`
4. In Development environment only, creates a local test manager account if it does not already exist.

Development manager account:

| Field | Value |
| --- | --- |
| Email | `test@local` |
| Password | `P@ssw0rd!` |
| Role | `Manager` |

## Access As Manager

1. Run the app.
2. Open the local URL shown in the terminal.
3. Go to:

```text
/Identity/Account/Login
```

4. Log in with:

```text
Email: test@local
Password: P@ssw0rd!
```

5. After login, open:

```text
/Admin/Dashboard
```

Manager capabilities:

- View all employee updates for the selected date.
- View update details.
- View all updates for a specific employee.
- Delete updates.
- See employee list on the home page.

Important: the seeded manager account is created only when the app runs in Development environment.

## Access As Employee

1. Run the app.
2. Open:

```text
/Identity/Account/Register
```

3. Register using an email and password.
4. The app automatically assigns newly registered users to the `Employee` role.
5. After registration, the employee is signed in automatically.

Employee capabilities:

- Add daily updates:

```text
/Update/Add
```

- View own updates:

```text
/Update/MyUpdates
```

- View details for own updates only.
- Edit own updates only.
- Delete own updates only.

Employees cannot access manager-only routes such as:

```text
/Admin/Dashboard
```

## How To Access The Database From SQL Server Management Studio

1. Open SQL Server Management Studio.
2. In the connection dialog, use:

```text
Server name: (localdb)\MSSQLLocalDB
Authentication: Windows Authentication
```

3. Click `Connect`.
4. Expand `Databases`.
5. Open:

```text
DailyUpdatesDB
```

Main tables:

| Table | Purpose |
| --- | --- |
| `AspNetUsers` | Application users/employees |
| `AspNetRoles` | Roles such as Manager and Employee |
| `AspNetUserRoles` | User-to-role mappings |
| `DailyUpdates` | Daily update records |

## Useful SQL Queries

View all users:

```sql
SELECT Id, Email, UserName, Name, Role, EmailConfirmed
FROM AspNetUsers
ORDER BY Email;
```

View all roles:

```sql
SELECT Id, Name
FROM AspNetRoles
ORDER BY Name;
```

View users with their assigned roles:

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

View daily updates with employee details:

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

View today's updates:

```sql
SELECT
    d.Id,
    u.Email,
    d.Feature,
    d.TicketNumber,
    d.Status,
    d.CreatedAt
FROM DailyUpdates d
INNER JOIN AspNetUsers u ON u.Id = d.EmployeeId
WHERE CAST(d.Date AS date) = CAST(GETDATE() AS date)
ORDER BY d.CreatedAt DESC;
```

## How To Make A Registered User A Manager

Best practice is to do role changes through application code or an admin screen. If you need to promote a local user directly in SQL during development, use this carefully:

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

After changing roles, log out and log back in so the authentication cookie gets the updated role.

## Password Reset Notes

The app includes a forgot-password flow using OTP.

Email configuration is optional in local development. If SMTP settings are not configured, the app does not send email and logs the behavior instead.

Optional email configuration keys:

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

Do not commit real production SMTP passwords to source control. Use user secrets, environment variables, or a secure configuration provider.

## Common Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Anonymous/authenticated | Home page |
| `/Identity/Account/Login` | Anonymous | Login |
| `/Identity/Account/Register` | Anonymous | Register employee account |
| `/Update/Add` | Authenticated users | Add daily update |
| `/Update/MyUpdates` | Authenticated users | View own updates |
| `/Admin/Dashboard` | Manager only | Manager dashboard |

## Validation Steps After Setup

Use this checklist to confirm the app works correctly:

1. Run `dotnet build` successfully.
2. Run `dotnet run`.
3. Confirm `DailyUpdatesDB` exists in SQL Server LocalDB.
4. Log in as manager with `test@local` / `P@ssw0rd!`.
5. Confirm `/Admin/Dashboard` opens for the manager.
6. Register a new employee account.
7. Add an update as the employee.
8. Confirm the employee can see the update in `/Update/MyUpdates`.
9. Log back in as manager and confirm the update appears in `/Admin/Dashboard`.
10. Run the SQL query for daily updates and confirm the record exists in `DailyUpdates`.

## Common Pitfalls

- If the app cannot connect to SQL Server, confirm LocalDB is installed and the server name is exactly `(localdb)\MSSQLLocalDB`.
- If the manager login does not exist, make sure the app is running in Development environment.
- If a user was promoted to Manager directly in SQL, log out and log in again.
- If database tables are missing, run the app once so `EnsureCreatedAsync()` can create the database schema.
- Do not use production credentials in `appsettings.json`.
- The app currently uses `EnsureCreatedAsync()` instead of EF Core migrations. For production or shared environments, migrations are usually the better long-term approach.

## Security Notes Before Publishing

Before publishing this app anywhere:

1. Change or remove the seeded test manager account.
2. Move secrets out of `appsettings.json`.
3. Use a production SQL Server connection string.
4. Enable HTTPS in the hosting environment.
5. Add a proper manager/user administration workflow instead of direct SQL role changes.
6. Consider adding EF Core migrations.
7. Review authorization rules before exposing the app publicly.

