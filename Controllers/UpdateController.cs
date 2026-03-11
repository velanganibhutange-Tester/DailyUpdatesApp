using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DailyUpdatesApp.Models;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
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

        public IActionResult Add() => View();

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Add(DailyUpdate model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            model.EmployeeId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            model.Date = DateTime.Today;
            _ctx.DailyUpdates.Add(model);
            _ctx.SaveChanges();
            return RedirectToAction("MyUpdates");
        }

        public IActionResult MyUpdates()
        {
            var empId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var updates = _ctx.DailyUpdates.Where(x=>x.EmployeeId==empId).ToList();
            return View(updates);
        }

        public IActionResult Details(int id)
        {
            var empId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var update = _ctx.DailyUpdates
                              .Where(x => x.Id == id && x.EmployeeId == empId)
                              .Include(x => x.Employee)
                              .FirstOrDefault();
            if (update == null)
            {
                return NotFound();
            }
            return View(update);
        }

        public IActionResult Edit(int id)
        {
            var empId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var update = _ctx.DailyUpdates.FirstOrDefault(x => x.Id == id && x.EmployeeId == empId);
            if (update == null)
            {
                return NotFound();
            }
            return View(update);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Edit(DailyUpdate model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var empId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var existing = _ctx.DailyUpdates.FirstOrDefault(x => x.Id == model.Id && x.EmployeeId == empId);
            if (existing == null)
            {
                return NotFound();
            }

            // Update allowed fields
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

            _ctx.DailyUpdates.Update(existing);
            _ctx.SaveChanges();

            return RedirectToAction("MyUpdates");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Delete(int id)
        {
            var empId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var update = _ctx.DailyUpdates.FirstOrDefault(x => x.Id == id && x.EmployeeId == empId);
            if (update == null)
            {
                return NotFound();
            }

            _ctx.DailyUpdates.Remove(update);
            _ctx.SaveChanges();
            return RedirectToAction("MyUpdates");
        }
    }
}