using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DailyUpdatesApp.Models
{
    public class ApplicationDbContext : IdentityDbContext<Employee>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<DailyUpdate> DailyUpdates { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<DailyUpdate>(entity =>
            {
                entity.HasIndex(x => x.Date);
                entity.HasIndex(x => new { x.EmployeeId, x.Date });

                entity.Property(x => x.EmployeeId).IsRequired();
                entity.HasOne(x => x.Employee)
                    .WithMany()
                    .HasForeignKey(x => x.EmployeeId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
