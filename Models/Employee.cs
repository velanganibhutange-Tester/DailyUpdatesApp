using Microsoft.AspNetCore.Identity;

namespace DailyUpdatesApp.Models
{
    public class Employee : IdentityUser
    {
        public string Name { get; set; }
        public string Role { get; set; }
    }
}