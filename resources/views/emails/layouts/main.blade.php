<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>@yield('title', config('app.name'))</title>
<style>
    /* ── Palette ────────────────────────────────────────────────────────────
       Navy    #0F2854   Royal Blue #1C4D8D   Sky Blue #4988C4   Ice Blue #BDE8F5
    ──────────────────────────────────────────────────────────────────────── */

    body, table, td, div, p, a, h1, h2, h3, h4, h5, h6 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
    }
    body {
        background-color: #e8f0fb;
        margin: 0;
        padding: 0;
        color: #1a2a4a;
        -webkit-font-smoothing: antialiased;
    }
    .wrapper { width: 100%; background-color: #e8f0fb; padding: 40px 0; }
    .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(15, 40, 84, 0.15);
    }

    /* Header */
    .header {
        background: linear-gradient(135deg, #0F2854 0%, #1C4D8D 60%, #4988C4 100%);
        padding: 40px 40px 36px;
        text-align: center;
    }
    .header-logo {
        display: inline-block;
        background: rgba(189, 232, 245, 0.2);
        border: 2px solid rgba(189, 232, 245, 0.4);
        border-radius: 12px;
        padding: 8px 20px;
        margin-bottom: 16px;
    }
    .header h1 {
        color: #ffffff;
        margin: 0;
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.02em;
    }
    .header-tagline {
        color: #BDE8F5;
        font-size: 13px;
        margin-top: 6px;
        opacity: 0.9;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    /* Accent bar under header */
    .accent-bar {
        height: 4px;
        background: linear-gradient(to right, #BDE8F5, #4988C4, #1C4D8D);
    }

    /* Content */
    .content { padding: 48px 40px; }
    .content h2 { color: #0F2854; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 12px; }
    .content p  { font-size: 15px; color: #374151; margin-top: 0; margin-bottom: 20px; }

    /* Icon badge */
    .icon-badge {
        display: inline-block;
        padding: 16px;
        border-radius: 50%;
        margin-bottom: 16px;
    }
    .icon-badge span { font-size: 32px; line-height: 1; }
    .badge-blue   { background-color: #dbeafe; }
    .badge-green  { background-color: #d1fae5; }
    .badge-red    { background-color: #fee2e2; }
    .badge-amber  { background-color: #fef3c7; }
    .badge-purple { background-color: #ede9fe; }
    .badge-ice    { background-color: #e0f2fe; }

    /* Buttons */
    .btn-container { text-align: center; margin: 32px 0; }
    .btn {
        display: inline-block;
        background: linear-gradient(135deg, #1C4D8D, #4988C4);
        color: #ffffff !important;
        padding: 14px 32px;
        text-decoration: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        text-align: center;
    }
    .btn-navy   { background: linear-gradient(135deg, #0F2854, #1C4D8D); }
    .btn-danger { background: linear-gradient(135deg, #b91c1c, #ef4444); }
    .btn-green  { background: linear-gradient(135deg, #047857, #10b981); }
    .btn-amber  { background: linear-gradient(135deg, #b45309, #f59e0b); color: #ffffff !important; }

    /* Info callout */
    .callout {
        padding: 16px 20px;
        border-radius: 8px;
        margin: 24px 0;
    }
    .callout-blue  { background-color: #eff6ff; border-left: 4px solid #1C4D8D; }
    .callout-green { background-color: #f0fdf4; border-left: 4px solid #10b981; }
    .callout-red   { background-color: #fef2f2; border-left: 4px solid #ef4444; }
    .callout-amber { background-color: #fffbeb; border-left: 4px solid #f59e0b; }
    .callout-ice   { background-color: #f0f9ff; border-left: 4px solid #4988C4; }

    .callout-blue  p { color: #1C4D8D; margin: 0; font-size: 14px; }
    .callout-green p { color: #065f46; margin: 0; font-size: 14px; }
    .callout-red   p { color: #991b1b; margin: 0; font-size: 14px; }
    .callout-amber p { color: #92400e; margin: 0; font-size: 14px; }
    .callout-ice   p { color: #0F2854; margin: 0; font-size: 14px; }

    /* Receipt Table */
    .receipt {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 32px;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #BDE8F5;
    }
    .receipt th, .receipt td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #dbeafe; font-size: 14px; }
    .receipt thead { background-color: #0F2854; }
    .receipt th { color: #BDE8F5; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; }
    .receipt tr:last-child td { border-bottom: none; }
    .receipt tr:nth-child(even) td { background-color: #f0f7ff; }
    .receipt .total td { font-weight: 700; color: #0F2854; font-size: 16px; background-color: #e0efff !important; border-top: 2px solid #4988C4; }

    /* Divider */
    .divider { border: none; border-top: 1px solid #BDE8F5; margin: 28px 0; }

    /* Footer */
    .footer {
        background: linear-gradient(180deg, #f0f7ff 0%, #e8f0fb 100%);
        padding: 32px 40px;
        text-align: center;
        border-top: 2px solid #BDE8F5;
    }
    .footer p { margin: 0; font-size: 12px; color: #6b7280; }
    .footer a { color: #1C4D8D; text-decoration: none; font-weight: 500; }
    .social-icons { margin-bottom: 20px; }
    .social-icons a { display: inline-block; margin: 0 8px; }
    .social-icons img { width: 22px; height: 22px; opacity: 0.6; filter: grayscale(60%); }

    /* Responsive */
    @media only screen and (max-width: 600px) {
        .wrapper  { padding: 0; }
        .container { border-radius: 0; width: 100%; }
        .content  { padding: 28px 20px; }
        .header   { padding: 28px 20px; }
        .footer   { padding: 24px 20px; }
    }
</style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="header-logo">
                    <h1>{{ config('app.name', 'Voyago') }}</h1>
                </div>
                <p class="header-tagline">Your Smart Travel Companion</p>
            </div>
            <div class="accent-bar"></div>
            <div class="content">
                @yield('content')
            </div>
            <div class="footer">
                <div class="social-icons">
                    <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook"></a>
                    <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/733/733590.png" alt="Instagram"></a>
                    <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter"></a>
                </div>
                <p>&copy; {{ date('Y') }} {{ config('app.name', 'Voyago') }}. All rights reserved.</p>
                <p style="margin-top: 6px;">123 Explorer Avenue, Suite 100, Cairo, Egypt</p>
                <p style="margin-top: 12px;">
                    You received this email because you are registered on our platform.<br>
                    <a href="{{ url('/unsubscribe') }}">Unsubscribe</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
