using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using DailyUpdatesApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DailyUpdatesApp.Controllers
{
    [Authorize]
    public class UpdateController : Controller
    {
        private readonly ApplicationDbContext _ctx;

        public UpdateController(ApplicationDbContext ctx)
        {
            _ctx = ctx;
        }

        private string CurrentEmployeeId => User.FindFirstValue(ClaimTypes.NameIdentifier);

        public IActionResult Add() => View();

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Add(
            [Bind("Feature,TicketNumber,TicketDescription,Status,Blockers,EstimatedHours,EstimatedMinutes,EstimatedSeconds,HasETAChange,ETAChangeDescription")]
            DailyUpdate model,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var empId = CurrentEmployeeId;
            if (string.IsNullOrWhiteSpace(empId))
            {
                return Challenge();
            }

            model.EmployeeId = empId;
            model.Date = DateTime.Today;
            model.CreatedAt = DateTime.Now;

            _ctx.DailyUpdates.Add(model);
            await _ctx.SaveChangesAsync(cancellationToken);
            return RedirectToAction(nameof(MyUpdates));
        }

        public async Task<IActionResult> MyUpdates(CancellationToken cancellationToken)
        {
            var empId = CurrentEmployeeId;
            if (string.IsNullOrWhiteSpace(empId))
            {
                return Challenge();
            }

            var updates = await _ctx.DailyUpdates
                .Where(x => x.EmployeeId == empId)
                .OrderByDescending(x => x.Date)
                .ThenByDescending(x => x.CreatedAt)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            return View(updates);
        }

        public async Task<IActionResult> Details(int id, CancellationToken cancellationToken)
        {
            var empId = CurrentEmployeeId;
            if (string.IsNullOrWhiteSpace(empId))
            {
                return Challenge();
            }

            var update = await _ctx.DailyUpdates
                .Where(x => x.Id == id && x.EmployeeId == empId)
                .Include(x => x.Employee)
                .AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);

            if (update == null)
            {
                return NotFound();
            }

            return View(update);
        }

        public async Task<IActionResult> Edit(int id, CancellationToken cancellationToken)
        {
            var empId = CurrentEmployeeId;
            if (string.IsNullOrWhiteSpace(empId))
            {
                return Challenge();
            }

            var update = await _ctx.DailyUpdates
                .Where(x => x.Id == id && x.EmployeeId == empId)
                .AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);

            if (update == null)
            {
                return NotFound();
            }

            return View(update);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(
            [Bind("Id,Feature,TicketNumber,TicketDescription,Status,Blockers,EstimatedHours,EstimatedMinutes,EstimatedSeconds,HasETAChange,ETAChangeDescription")]
            DailyUpdate model,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var empId = CurrentEmployeeId;
            if (string.IsNullOrWhiteSpace(empId))
            {
                return Challenge();
            }

            var existing = await _ctx.DailyUpdates
                .FirstOrDefaultAsync(x => x.Id == model.Id && x.EmployeeId == empId, cancellationToken);

            if (existing == null)
            {
                return NotFound();
            }

            existing.Feature = model.Feature;
            existing.TicketNumber = model.TicketNumber;
            existing.TicketDescription = model.TicketDescription;
            existing.Status = model.Status;
            existing.Blockers = model.Blockers;
            existing.EstimatedHours = model.EstimatedHours;
            existing.EstimatedMinutes = model.EstimatedMinutes;
            existing.EstimatedSeconds = model.EstimatedSeconds;
            existing.HasETAChange = model.HasETAChange;
            existing.ETAChangeDescription = model.ETAChangeDescription;

            await _ctx.SaveChangesAsync(cancellationToken);
            return RedirectToAction(nameof(MyUpdates));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var empId = CurrentEmployeeId;
            if (string.IsNullOrWhiteSpace(empId))
            {
                return Challenge();
            }

            var update = await _ctx.DailyUpdates
                .FirstOrDefaultAsync(x => x.Id == id && x.EmployeeId == empId, cancellationToken);

            if (update == null)
            {
                return NotFound();
            }

            _ctx.DailyUpdates.Remove(update);
            await _ctx.SaveChangesAsync(cancellationToken);
            return RedirectToAction(nameof(MyUpdates));
        }
    }
}
