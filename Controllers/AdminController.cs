using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DailyUpdatesApp.Models;
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

        public IActionResult Dashboard(DateTime? date)
        {
            var d = date ?? DateTime.Today;
            var updates = _ctx.DailyUpdates
                             .Where(x=>x.Date==d)
                             .Include(x=>x.Employee)
                             .ToList();
            return View(updates);
        }

        public IActionResult Details(int id)
        {
            var update = _ctx.DailyUpdates
                              .Where(x => x.Id == id)
                              .Include(x => x.Employee)
                              .FirstOrDefault();
            if (update == null)
            {
                return NotFound();
            }
            return View(update);
        }

        // Shows all updates for a specific employee in descending order (most recent first)
        public IActionResult EmployeeUpdates(string employeeId)
        {
            if (string.IsNullOrEmpty(employeeId)) return BadRequest();

            var updates = _ctx.DailyUpdates
                              .Where(x => x.EmployeeId == employeeId)
                              .Include(x => x.Employee)
                              .OrderByDescending(x => x.CreatedAt)
                              .ToList();

            ViewData["EmployeeName"] = _ctx.Users.Where(u => u.Id == employeeId).Select(u => u.Name).FirstOrDefault() ?? "Unknown";
            return View(updates);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Delete(int id)
        {
            var update = _ctx.DailyUpdates.FirstOrDefault(x => x.Id == id);
            if (update == null)
            {
                return NotFound();
            }

            _ctx.DailyUpdates.Remove(update);
            _ctx.SaveChanges();
            return RedirectToAction("Dashboard");
        }
    }
}