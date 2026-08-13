'use strict';

/* ============================================================
   Itinera – Sign in
   ============================================================ */
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    document.getElementById('loginError').classList.remove('show');

    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = this.querySelector('button[type=submit]');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in…';

    try {
        var res = await TP.api('/login', { method: 'POST', body: JSON.stringify({ email: email, password: password }) });
        TP.setSession(res.token, res.user || {});
        TP.setFlash('Welcome back! Trip planning ready.');
        window.location.href = 'overview.html';
    } catch (err) {
        document.getElementById('loginError').classList.add('show');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign in';
    }
});