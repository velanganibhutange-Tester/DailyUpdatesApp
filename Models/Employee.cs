using Microsoft.AspNetCore.Identity;
using System;

namespace DailyUpdatesApp.Models
{
    public class Employee : IdentityUser
    {
        public string Name { get; set; }
        public string Role { get; set; }
        public string Department { get; set; }
        public DateTime JoinDate { get; set; } = DateTime.Today;
        public bool IsActive { get; set; } = true;
    }
}
