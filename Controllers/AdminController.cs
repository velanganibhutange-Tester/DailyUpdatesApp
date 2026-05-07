using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DailyUpdatesApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DailyUpdatesApp.Controllers
{
    [Authorize(Roles="Manager")]
    public class AdminController : Controller
    {
        private readonly ApplicationDbContext _ctx;

        public AdminController(ApplicationDbContext ctx)
        {
            _ctx = ctx;
        }

        public async Task<IActionResult> Dashboard(DateTime? date, CancellationToken cancellationToken)
        {
            var d = (date ?? DateTime.Today).Date;
            var next = d.AddDays(1);

            var updates = await _ctx.DailyUpdates
                .Where(x => x.Date >= d && x.Date < next)
                .Include(x => x.Employee)
                .OrderByDescending(x => x.CreatedAt)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            return View(updates);
        }

        public async Task<IActionResult> Details(int id, CancellationToken cancellationToken)
        {
            var update = await _ctx.DailyUpdates
                .Where(x => x.Id == id)
                .Include(x => x.Employee)
                .AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);
            if (update == null)
            {
                return NotFound();
            }
            return View(update);
        }

        // Shows all updates for a specific employee in descending order (most recent first)
        public async Task<IActionResult> EmployeeUpdates(string id, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(id)) return BadRequest();
            var employeeId = id;

            var updates = await _ctx.DailyUpdates
                .Where(x => x.EmployeeId == employeeId)
                .OrderByDescending(x => x.CreatedAt)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var employeeName = await _ctx.Users
                .Where(u => u.Id == employeeId)
                .Select(u => u.Name)
                .AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);

            ViewData["EmployeeName"] = employeeName ?? "Unknown";
            return View(updates);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var update = await _ctx.DailyUpdates.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (update == null)
            {
                return NotFound();
            }

            _ctx.DailyUpdates.Remove(update);
            await _ctx.SaveChangesAsync(cancellationToken);
            return RedirectToAction("Dashboard");
        }
    }
}
