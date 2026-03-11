using System.Collections.Generic;

namespace DailyUpdatesApp.Models.ViewModels
{
    public class HomeIndexViewModel
    {
        public IEnumerable<DailyUpdate> Updates { get; set; }
        public IEnumerable<Employee> Employees { get; set; }
    }
}
