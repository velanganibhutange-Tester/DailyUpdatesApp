using System;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace DailyUpdatesApp.Services
{
    public sealed class PasswordResetOtpService
    {
        private readonly IMemoryCache _cache;
        private readonly TimeSpan _ttl = TimeSpan.FromMinutes(10);
        private readonly TimeSpan _regenerateCooldown = TimeSpan.FromSeconds(30);
        private const int MaxAttempts = 5;

        public PasswordResetOtpService(IMemoryCache cache)
        {
            _cache = cache;
        }

        public string GenerateAndStore(string email)
        {
            var key = CacheKey(email);

            if (_cache.TryGetValue<OtpEntry>(key, out var existing) && existing.CreatedAt + _regenerateCooldown > DateTimeOffset.UtcNow)
            {
                // Avoid spamming; generate a new OTP only after a short cooldown.
                return existing.PlainCode;
            }

            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6", CultureInfo.InvariantCulture);
            var salt = RandomNumberGenerator.GetBytes(16);
            var hash = Hash(email, code, salt);

            var entry = new OtpEntry
            {
                Salt = salt,
                Hash = hash,
                Attempts = 0,
                ExpiresAt = DateTimeOffset.UtcNow.Add(_ttl),
                CreatedAt = DateTimeOffset.UtcNow,
                PlainCode = code,
            };

            _cache.Set(key, entry, entry.ExpiresAt);
            return code;
        }

        public bool TryValidateAndConsume(string email, string code, out string error)
        {
            error = null;
            var key = CacheKey(email);

            if (!_cache.TryGetValue<OtpEntry>(key, out var entry))
            {
                error = "OTP is expired or invalid. Please request a new OTP.";
                return false;
            }

            if (entry.ExpiresAt <= DateTimeOffset.UtcNow)
            {
                _cache.Remove(key);
                error = "OTP is expired. Please request a new OTP.";
                return false;
            }

            var candidate = Hash(email, code, entry.Salt);
            if (!CryptographicOperations.FixedTimeEquals(candidate, entry.Hash))
            {
                entry.Attempts++;
                _cache.Set(key, entry, entry.ExpiresAt);

                if (entry.Attempts >= MaxAttempts)
                {
                    _cache.Remove(key);
                    error = "Too many invalid attempts. Please request a new OTP.";
                }
                else
                {
                    error = "Invalid OTP. Please try again.";
                }

                return false;
            }

            _cache.Remove(key);
            return true;
        }

        private static string CacheKey(string email) => $"pwdreset-otp:{email?.Trim().ToUpperInvariant()}";

        private static byte[] Hash(string email, string code, byte[] salt)
        {
            var bytes = Encoding.UTF8.GetBytes($"{email?.Trim().ToUpperInvariant()}:{code}");
            var buffer = new byte[salt.Length + bytes.Length];
            Buffer.BlockCopy(salt, 0, buffer, 0, salt.Length);
            Buffer.BlockCopy(bytes, 0, buffer, salt.Length, bytes.Length);
            return SHA256.HashData(buffer);
        }

        private sealed class OtpEntry
        {
            public byte[] Salt { get; init; }
            public byte[] Hash { get; init; }
            public int Attempts { get; set; }
            public DateTimeOffset ExpiresAt { get; init; }
            public DateTimeOffset CreatedAt { get; init; }
            public string PlainCode { get; init; }
        }
    }
}

