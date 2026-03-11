// Attach toggle handlers for any password field wrapper
document.addEventListener('DOMContentLoaded', function () {
    const svgEye = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const svgEyeOff = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.94 21.94 0 0 1 5.06-7.94"></path><path d="M1 1l22 22"></path></svg>';

    document.querySelectorAll('.password-field-wrapper').forEach(function (wrapper) {
        var input = wrapper.querySelector('input[type="password"], input[type="text"]');
        var btn = wrapper.querySelector('.toggle-password-btn');
        if (!input || !btn) return;

        // Initialize button with SVG and accessible label
        btn.innerHTML = svgEye;
        btn.setAttribute('aria-label', 'Show password');
        btn.setAttribute('aria-pressed', 'false');

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            // Toggle icon and aria
            btn.innerHTML = isPassword ? svgEyeOff : svgEye;
            btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
            btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });
    });
});