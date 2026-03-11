using Microsoft.AspNetCore.Mvc;
using DailyUpdatesApp.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Collections.Generic;

namespace DailyUpdatesApp.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _ctx;

        public HomeController(ApplicationDbContext ctx)
        {
            _ctx = ctx;
        }

        public IActionResult Index()
        {
            // For authenticated users: show today's updates
            if (User?.Identity?.IsAuthenticated ?? false)
            {
                var today = System.DateTime.Today;
                var updates = _ctx.DailyUpdates
                    .Where(x => x.Date == today)
                    .Include(x => x.Employee)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToList();

                // If manager, also show employees list on Home for quick access
                if (User.IsInRole("Manager"))
                {
                    var employees = _ctx.Users
                        .OrderBy(e => e.Name)
                        .ToList();

                    var vm = new Models.ViewModels.HomeIndexViewModel
                    {
                        Updates = updates,
                        Employees = employees
                    };
                    return View(vm);
                }

                return View(updates);
            }

            return View(new List<DailyUpdate>());
        }
    }
}
