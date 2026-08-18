<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>@yield('title', config('app.name', 'Itinera'))</title>
<style>
    /* ── Palette ────────────────────────────────────────────────────────────
       Cream  #E8DED2   Mint #A3D2CA   Teal #5EAAA8   Deep Teal #056676
    ──────────────────────────────────────────────────────────────────────── */

    body, table, td, div, p, a, h1, h2, h3, h4, h5, h6 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
    }
    body {
        background-color: #E8DED2;
        margin: 0;
        padding: 0;
        color: #3E3A33;
        -webkit-font-smoothing: antialiased;
    }
    .wrapper { width: 100%; background-color: #E8DED2; padding: 48px 16px; }
    .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border: 1px solid #DDD3C5;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 12px 32px rgba(5, 102, 118, 0.12);
    }

    /* Header */
    .header {
        background-color: #ffffff;
        padding: 36px 40px 28px;
        text-align: center;
        border-bottom: 1px solid #EDE5DA;
    }
    .brand {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 20px;
        font-weight: 700;
        color: #056676;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        margin: 0;
    }
    .brand-rule {
        width: 36px;
        height: 3px;
        background-color: #A3D2CA;
        margin: 12px auto 10px;
        border: none;
    }
    .brand-tagline {
        margin: 0;
        font-size: 11px;
        color: #5EAAA8;
        letter-spacing: 0.34em;
        text-transform: uppercase;
    }

    /* Content */
    .content { padding: 44px 48px 40px; }
    .content h2 {
        font-family: Georgia, 'Times New Roman', serif;
        color: #056676;
        font-size: 22px;
        font-weight: 700;
        margin: 6px 0 14px;
        line-height: 1.3;
    }
    .content p { font-size: 15px; color: #4A4640; margin-top: 0; margin-bottom: 18px; }
    .eyebrow {
        font-size: 11px;
        font-weight: 700;
        color: #5EAAA8;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        margin: 0 0 4px;
    }
    .headline { text-align: center; margin-bottom: 30px; }

    /* Feature list */
    .features { width: 100%; border-collapse: collapse; margin: 22px 0 6px; }
    .features tr td {
        padding: 14px 0;
        border-bottom: 1px solid #EDE5DA;
        vertical-align: top;
    }
    .features tr:last-child td { border-bottom: none; }
    .features .mark {
        width: 10px;
        font-size: 10px;
        color: #A3D2CA;
        padding-right: 12px;
    }
    .features .feature-title { font-weight: 600; color: #056676; font-size: 15px; }
    .features .feature-sub { font-size: 13px; color: #7A756E; line-height: 1.5; }

    /* Detail card */
    .card {
        background-color: #F4EFE8;
        border: 1px solid #E4DACB;
        border-radius: 10px;
        padding: 22px 24px;
        margin: 26px 0;
    }
    .card-mint {
        background-color: #F0F7F5;
        border: 1px solid #A3D2CA;
    }
    .card-warn {
        background-color: #FBF6F2;
        border: 1px dashed #5EAAA8;
    }
    .card table { width: 100%; border-collapse: collapse; }
    .card td { padding: 8px 0; font-size: 14px; }
    .card .k { color: #7A756E; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; width: 42%; }
    .card .v { color: #3E3A33; font-weight: 600; text-align: right; }

    /* Receipt */
    .receipt {
        width: 100%;
        border-collapse: collapse;
        margin: 24px 0 8px;
        border: 1px solid #E4DACB;
        border-radius: 10px;
        overflow: hidden;
    }
    .receipt th, .receipt td { padding: 13px 16px; text-align: left; border-bottom: 1px solid #EDE5DA; font-size: 14px; }
    .receipt thead { background-color: #E8DED2; }
    .receipt th {
        color: #056676;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 11px;
    }
    .receipt tr:last-child td { border-bottom: none; }
    .receipt .total td {
        background-color: #056676;
        color: #ffffff;
        font-weight: 700;
        font-size: 15px;
        border-top: none;
    }

    /* Buttons */
    .btn-container { text-align: center; margin: 34px 0 6px; }
    .btn {
        display: inline-block;
        background-color: #056676;
        color: #ffffff !important;
        padding: 13px 32px;
        text-decoration: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-align: center;
    }
    .btn-mint { background-color: #A3D2CA; color: #045D66 !important; }
    .btn-outline {
        background-color: #ffffff;
        border: 1px solid #5EAAA8;
        color: #056676 !important;
        padding: 12px 31px;
    }

    /* Callout */
    .callout {
        padding: 16px 20px;
        border-radius: 8px;
        margin: 24px 0;
        background-color: #F0F7F5;
        border-left: 3px solid #A3D2CA;
    }
    .callout p { color: #3E3A33; margin: 0; font-size: 14px; }
    .callout .label {
        display: block;
        font-size: 10px;
        font-weight: 700;
        color: #5EAAA8;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        margin-bottom: 6px;
    }

    /* Quote */
    .quote {
        background-color: #F4EFE8;
        border: 1px solid #E4DACB;
        border-radius: 10px;
        padding: 20px 22px;
        margin: 26px 0;
    }
    .quote p { margin: 0; font-style: italic; color: #4A4640; font-size: 14px; line-height: 1.7; }

    /* Divider */
    .divider { border: none; border-top: 1px solid #EDE5DA; margin: 28px 0; }

    /* Footer */
    .footer {
        background-color: #FBF8F3;
        padding: 30px 40px;
        text-align: center;
        border-top: 1px solid #EDE5DA;
    }
    .footer p { margin: 0; font-size: 12px; color: #8A8072; }
    .footer a { color: #5EAAA8; text-decoration: none; font-weight: 600; }

    /* Responsive */
    @media only screen and (max-width: 600px) {
        .wrapper   { padding: 0; }
        .container { border-radius: 0; border-left: none; border-right: none; }
        .content   { padding: 30px 24px; }
        .header    { padding: 28px 24px; }
        .footer    { padding: 24px; }
    }
</style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                @if(file_exists(public_path('images/logo.png')))
                    <div style="text-align: center; margin-bottom: 12px;">
                        <img src="{{ $message->embed(public_path('images/logo.png')) }}" alt="Itinera Logo" style="height: 52px; width: auto; display: inline-block;" />
                    </div>
                @endif
                <p class="brand">{{ config('app.name', 'Itinera') }}</p>
                <div class="brand-rule"></div>
                <p class="brand-tagline">Curated Journeys</p>
            </div>
            <div class="content">
                @yield('content')
            </div>
            <div class="footer">
                <p>&copy; {{ date('Y') }} {{ config('app.name', 'Itinera') }}. All rights reserved.</p>
                <p style="margin-top: 8px;">Cairo, Egypt</p>
                <p style="margin-top: 14px;">
                    You are receiving this email because you hold an account with us.<br>
                    <a href="{{ url('/unsubscribe') }}">Manage email preferences</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
