using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DailyUpdatesApp.Models;
using DailyUpdatesApp.Models.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DailyUpdatesApp.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _ctx;

        public HomeController(ApplicationDbContext ctx)
        {
            _ctx = ctx;
        }

        public async Task<IActionResult> Index(CancellationToken cancellationToken)
        {
            var vm = new HomeIndexViewModel
            {
                Updates = Enumerable.Empty<DailyUpdate>(),
                Employees = Enumerable.Empty<Employee>(),
            };

            if (User?.Identity?.IsAuthenticated ?? false)
            {
                var today = DateTime.Today;
                var next = today.AddDays(1);

                vm.Updates = await _ctx.DailyUpdates
                    .Where(x => x.Date >= today && x.Date < next)
                    .Include(x => x.Employee)
                    .OrderByDescending(x => x.CreatedAt)
                    .AsNoTracking()
                    .ToListAsync(cancellationToken);

                if (User.IsInRole("Manager"))
                {
                    vm.Employees = await _ctx.Users
                        .OrderBy(e => e.Name)
                        .AsNoTracking()
                        .ToListAsync(cancellationToken);
                }
            }

            return View(vm);
        }
    }
}
