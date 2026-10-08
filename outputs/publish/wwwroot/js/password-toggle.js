// Password field eye toggle (used across Identity pages)
(function () {
    const svgEye =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>';

    const svgEyeOff =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.94 21.94 0 0 1 5.06-7.94"></path><path d="M1 1l22 22"></path></svg>';

    function syncButton(input, btn) {
        var isPassword = (input.getAttribute('type') || '').toLowerCase() !== 'text';

        // If the input is disabled, disable the toggle too (avoid confusing UX).
        btn.disabled = !!input.disabled;

        btn.innerHTML = isPassword ? svgEye : svgEyeOff;
        btn.setAttribute('aria-pressed', isPassword ? 'false' : 'true');
        btn.setAttribute('aria-label', isPassword ? 'Show password' : 'Hide password');
    }

    function initWrapper(wrapper) {
        var input = wrapper.querySelector('input[type="password"], input[type="text"]');
        var btn = wrapper.querySelector('.toggle-password-btn');
        if (!input || !btn) return;

        // Prevent double-init when the script is included more than once.
        if (btn.dataset && btn.dataset.passwordToggleInit === '1') return;
        if (btn.dataset) btn.dataset.passwordToggleInit = '1';

        // Ensure it's not treated like a submit button.
        btn.setAttribute('type', 'button');

        syncButton(input, btn);

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (input.disabled) return;

            var isPassword = (input.getAttribute('type') || '').toLowerCase() !== 'text';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            syncButton(input, btn);
        });

        // Keep state in sync if some other script toggles input `type`/`disabled`.
        if (typeof MutationObserver !== 'undefined') {
            var observer = new MutationObserver(function () {
                syncButton(input, btn);
            });

            observer.observe(input, {
                attributes: true,
                attributeFilter: ['type', 'disabled'],
            });
        }
    }

    function init() {
        document.querySelectorAll('.password-field-wrapper').forEach(initWrapper);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
