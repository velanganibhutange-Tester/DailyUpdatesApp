using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using DailyUpdatesApp.Models;
using DailyUpdatesApp.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DailyUpdatesApp.Areas.Identity.Pages.Account
{
    public class ForgotPasswordModel : PageModel
    {
        private readonly UserManager<Employee> _userManager;
        private readonly PasswordResetOtpService _otpService;
        private readonly IEmailSender _emailSender;
        private readonly IHostEnvironment _environment;
        private readonly ILogger<ForgotPasswordModel> _logger;

        public ForgotPasswordModel(
            UserManager<Employee> userManager,
            PasswordResetOtpService otpService,
            IEmailSender emailSender,
            IHostEnvironment environment,
            ILogger<ForgotPasswordModel> logger)
        {
            _userManager = userManager;
            _otpService = otpService;
            _emailSender = emailSender;
            _environment = environment;
            _logger = logger;
        }

        [BindProperty]
        public InputModel Input { get; set; } = new();

        [TempData]
        public string StatusMessage { get; set; }

        [TempData]
        public string DevOtp { get; set; }

        public class InputModel
        {
            [Required]
            [EmailAddress]
            public string Email { get; set; }

            [Display(Name = "OTP")]
            public string Otp { get; set; }

            [DataType(DataType.Password)]
            [Display(Name = "New password")]
            public string NewPassword { get; set; }

            [DataType(DataType.Password)]
            [Display(Name = "Confirm password")]
            public string ConfirmPassword { get; set; }
        }

        public void OnGet(string email = null)
        {
            if (!string.IsNullOrWhiteSpace(email))
            {
                Input.Email = email;
            }
        }

        public async Task<IActionResult> OnPostSendOtpAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            var email = (Input.Email ?? string.Empty).Trim();

            // Don't reveal whether the user exists.
            var user = await _userManager.FindByEmailAsync(email);
            if (user != null)
            {
                var otp = _otpService.GenerateAndStore(email);
                var subject = "Your OTP for password reset";
                var html = $"<p>Your OTP is <strong>{otp}</strong>. It expires in 10 minutes.</p>";

                try
                {
                    await _emailSender.SendEmailAsync(email, subject, html);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send OTP email to {Email}.", email);
                }

                if (_environment.IsDevelopment())
                {
                    DevOtp = otp;
                }
            }

            StatusMessage = "If an account exists for that email, an OTP has been sent.";
            return Page();
        }

        public async Task<IActionResult> OnPostChangeAsync()
        {
            var email = (Input.Email ?? string.Empty).Trim();
            var otp = (Input.Otp ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(email))
            {
                ModelState.AddModelError("Input.Email", "Email is required.");
            }

            if (string.IsNullOrWhiteSpace(otp))
            {
                ModelState.AddModelError("Input.Otp", "OTP is required.");
            }

            if (string.IsNullOrWhiteSpace(Input.NewPassword))
            {
                ModelState.AddModelError("Input.NewPassword", "New password is required.");
            }

            if (string.IsNullOrWhiteSpace(Input.ConfirmPassword))
            {
                ModelState.AddModelError("Input.ConfirmPassword", "Confirm password is required.");
            }
            else if (!string.Equals(Input.NewPassword, Input.ConfirmPassword, StringComparison.Ordinal))
            {
                ModelState.AddModelError("Input.ConfirmPassword", "The password and confirmation password do not match.");
            }

            if (!ModelState.IsValid)
            {
                return Page();
            }

            if (!_otpService.TryValidateAndConsume(email, otp, out var otpError))
            {
                ModelState.AddModelError("Input.Otp", otpError);
                return Page();
            }

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                ModelState.AddModelError(string.Empty, "OTP is expired or invalid. Please request a new OTP.");
                return Page();
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, Input.NewPassword);

            if (result.Succeeded)
            {
                TempData["StatusMessage"] = "Password updated successfully. Please log in with your new password.";
                return RedirectToPage("./Login");
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }

            return Page();
        }
    }
}
