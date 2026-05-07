using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DailyUpdatesApp.Models
{
    public class DailyUpdate : IValidatableObject
    {
        public int Id { get; set; }
        public string EmployeeId { get; set; }
        public Employee Employee { get; set; }
        public DateTime Date { get; set; }
        // Priority and Description removed (basic info section)
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // New Project Management Fields
        [Required]
        public string Feature { get; set; } // Feature/Module name

        [Required]
        public string TicketNumber { get; set; } // Ticket Number (e.g., PHOENIX-11516)

        [Required]
        public string TicketDescription { get; set; } // Ticket Description

        [Required]
        public string Status { get; set; } // Status: In Progress, Ready for Production, Blocked, In UAT, Done

        public string Blockers { get; set; } // Blockers description

        [Range(0, 23)]
        public int EstimatedHours { get; set; } // ETA Hours

        [Range(0, 59)]
        public int EstimatedMinutes { get; set; } // ETA Minutes

        [Range(0, 59)]
        public int EstimatedSeconds { get; set; } // ETA Seconds

        public bool HasETAChange { get; set; } // ETA Changed: Yes/No

        public string ETAChangeDescription { get; set; } // ETA Change Description

        [NotMapped]
        public TimeSpan EstimatedTime => new TimeSpan(EstimatedHours, EstimatedMinutes, EstimatedSeconds);

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (HasETAChange && string.IsNullOrWhiteSpace(ETAChangeDescription))
            {
                yield return new ValidationResult(
                    "ETA change description is required when ETA is marked as changed.",
                    new[] { nameof(ETAChangeDescription) });
            }
        }
    }
}
