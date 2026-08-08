<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>@yield('title', config('app.name'))</title>
<style>
    /* Base Resets */
    body, table, td, div, p, a, h1, h2, h3, h4, h5, h6 { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; }
    body { background-color: #f4f7f6; margin: 0; padding: 0; color: #374151; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f4f7f6; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    
    /* Header */
    .header { background-color: #0284c7; padding: 40px 40px; text-align: center; background-image: linear-gradient(to right, #0284c7, #2563eb); }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
    
    /* Content */
    .content { padding: 48px 40px; }
    .content h2 { color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 16px; }
    .content p { font-size: 16px; color: #4b5563; margin-top: 0; margin-bottom: 24px; }
    
    /* Buttons */
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; transition: background-color 0.2s; }
    .btn-danger { background-color: #ef4444; }
    .btn-success { background-color: #10b981; }
    .btn-premium { background-color: #f59e0b; color: #ffffff !important; }
    
    /* Receipt Table */
    .receipt { width: 100%; border-collapse: collapse; margin-bottom: 32px; background-color: #f9fafb; border-radius: 8px; overflow: hidden; }
    .receipt th, .receipt td { padding: 16px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 15px; }
    .receipt th { color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; font-size: 12px; }
    .receipt tr:last-child td { border-bottom: none; }
    .receipt .total td { font-weight: 700; color: #111827; font-size: 18px; border-top: 2px solid #e5e7eb; }
    
    /* Footer */
    .footer { background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 0; font-size: 13px; color: #6b7280; }
    .footer a { color: #0284c7; text-decoration: none; }
    .social-icons { margin-bottom: 24px; }
    .social-icons img { width: 24px; height: 24px; margin: 0 12px; opacity: 0.5; filter: grayscale(100%); }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
        .wrapper { padding: 0; }
        .container { border-radius: 0; width: 100%; }
        .content { padding: 32px 24px; }
        .header { padding: 32px 24px; }
        .footer { padding: 32px 24px; }
    }
</style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>{{ config('app.name', 'Voyago') }}</h1>
            </div>
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
                <p style="margin-top: 8px;">123 Explorer Avenue, Suite 100, Cairo, Egypt</p>
                <p style="margin-top: 16px;">You received this email because you are registered on our platform. <br><a href="{{ url('/unsubscribe') }}">Unsubscribe</a></p>
            </div>
        </div>
    </div>
</body>
</html>
