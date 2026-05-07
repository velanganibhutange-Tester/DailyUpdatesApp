using System;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DailyUpdatesApp.Services
{
    public sealed class EmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly IHostEnvironment _environment;
        private readonly ILogger<EmailSender> _logger;

        public EmailSender(IConfiguration configuration, IHostEnvironment environment, ILogger<EmailSender> logger)
        {
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
        {
            var host = _configuration["Email:Smtp:Host"];
            var from = _configuration["Email:From"];

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
            {
                // App isn't configured for outbound SMTP; log in Dev and no-op.
                if (_environment.IsDevelopment())
                {
                    _logger.LogInformation("Email not sent (SMTP not configured). To={To} Subject={Subject}", toEmail, subject);
                }
                else
                {
                    _logger.LogWarning("Email not sent (SMTP not configured). To={To} Subject={Subject}", toEmail, subject);
                }

                return;
            }

            var port = int.TryParse(_configuration["Email:Smtp:Port"], out var parsedPort) ? parsedPort : 587;
            var enableSsl = !string.Equals(_configuration["Email:Smtp:EnableSsl"], "false", StringComparison.OrdinalIgnoreCase);
            var username = _configuration["Email:Smtp:Username"];
            var password = _configuration["Email:Smtp:Password"];

            using var message = new MailMessage(from, toEmail, subject, htmlBody) { IsBodyHtml = true };
            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
            };

            if (!string.IsNullOrWhiteSpace(username))
            {
                client.Credentials = new NetworkCredential(username, password);
            }

            // SmtpClient doesn't support CancellationToken; best-effort async.
            await client.SendMailAsync(message);
        }
    }
}

