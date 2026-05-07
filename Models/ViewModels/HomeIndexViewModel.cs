using System.Collections.Generic;
using System.Linq;

namespace DailyUpdatesApp.Models.ViewModels
{
    public class HomeIndexViewModel
    {
        public IEnumerable<DailyUpdate> Updates { get; set; } = Enumerable.Empty<DailyUpdate>();
        public IEnumerable<Employee> Employees { get; set; } = Enumerable.Empty<Employee>();
    }
}
