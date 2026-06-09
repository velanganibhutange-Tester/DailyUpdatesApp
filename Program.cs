using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using DailyUpdatesApp.Models;
using DailyUpdatesApp.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();
builder.Services.AddMemoryCache();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), 
        sqlServerOptions => sqlServerOptions.EnableRetryOnFailure(maxRetryCount: 5)));

builder.Services.AddDefaultIdentity<Employee>(options => options.SignIn.RequireConfirmedAccount = false)
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddSingleton<IEmailSender, EmailSender>();
builder.Services.AddSingleton<PasswordResetOtpService>();

var app = builder.Build();

// Initialize database with roles
await using (var scope = app.Services.CreateAsyncScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await context.Database.EnsureCreatedAsync();
    
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Employee>>();
    
    // Create roles if they don't exist
    string[] roleNames = { "Manager", "Employee" };
    foreach (var roleName in roleNames)
    {
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }

    // Seed a test user for local testing only in Development
    if (app.Environment.IsDevelopment())
    {
        var testEmail = "test@local";
        var testUser = await userManager.FindByEmailAsync(testEmail);
        if (testUser == null)
        {
            var seededUser = new Employee
            {
                UserName = testEmail,
                Email = testEmail,
                Name = "Local Tester",
                Role = "Manager",
                Department = "Local",
                JoinDate = DateTime.Today,
                IsActive = true,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(seededUser, "P@ssw0rd!");
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(seededUser, "Manager");
            }
        }
    }
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();

app.Run();
