---
pdf_options:
  format: A4
  margin:
    top: 15mm
    bottom: 20mm
    left: 15mm
    right: 15mm
  printBackground: true
  displayHeaderFooter: true
  headerTemplate: "<span></span>"
  footerTemplate: "<div style='font-size:9px;width:100%;text-align:center;color:#999;padding:4px 20px;font-family:Helvetica,Arial,sans-serif;'>Conference Platform &mdash; Team 2 &mdash; Confidential &mdash; Page <span class='pageNumber'></span></div>"
---

<style>
  @page :first { margin-bottom: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 0;}
  .page-break { page-break-after: always; }
  table { width: 100%; border-collapse: collapse; margin-top: 0; margin-bottom: 20px; font-size: 13px; border: 1px solid #e0e0e0; page-break-inside: avoid; page-break-before: auto; }
  th { background-color: #e9ecef; color: #16294E; padding: 8px 8px; text-align: left; border: 1px solid #e0e0e0; font-size: 12px; }
  td { padding: 8px 8px; border: 1px solid #e0e0e0; vertical-align: top; font-size: 12px; }
  tr:nth-child(even) { background-color: #fcfcfc; }
  code { background-color: #f1f3f5; color: #d63384; padding: 2px 5px; border-radius: 3px; font-size: 12.5px; border: 1px solid #e9ecef; }
  .module-section { margin-bottom: 20px; page-break-inside: avoid; }
  th:nth-child(1), th:nth-child(2), th:nth-child(4) { text-align: center; }
</style>

<!-- PAGE 1: COVER -->
<div style='background-color: #16294E; color: white; height: 90vh; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; margin-top: 10px; text-align: center; padding: 40px; -webkit-print-color-adjust: exact;'>
  <div style='background-color: #F59E0B; color: white; font-size: 42px; font-weight: bold; width: 130px; height: 130px; display: inline-flex; align-items: center; justify-content: center; border-radius: 16px; margin-bottom: 40px;'>T2</div>
  <h1 style='font-size:58px;margin:0;color:white;border:none;letter-spacing:1px;font-family:sans-serif;'>Conference Platform</h1>
  <h2 style='color:#F59E0B;border:none;font-weight:normal;margin-top:10px;font-size:26px;font-family:sans-serif;'>API &amp; Web Platform Reference</h2>
  <hr style='width:300px;border:0;border-top:1px solid #F59E0B;margin:40px auto;'>
  <p style='font-size:16px;margin:5px 0;color:#e9ecef;'>Team 2 &middot; Laravel API &middot; JWT Auth &middot; Subscription Billing</p>
  <p style='font-size:16px;margin:5px 0;color:#e9ecef;'>Version 1.0 &middot; Generated: August 9, 2026</p>
  <p style='font-size:16px;margin:5px 0;color:#e9ecef;'><span id='cover-count'> API routes &middot; 36 sections &middot; + website documentation</span></p>
</div>

<div class="page-break"></div>

<!-- METHOD LEGEND -->
<div style="text-align:center;margin-bottom:15px;">
  <h2 style='color:#16294E;font-family:sans-serif;font-size:22px;margin-bottom:6px;'>HTTP Methods &amp; Resource Actions</h2>
  <p style="color:#666;font-size:13px;margin:0;">Standard RESTful routing definitions used throughout the Conference Platform.</p>
</div>

<table style="width:100%;border-collapse:collapse;font-size:12px;text-align:center;border:1px solid #e0e0e0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-bottom:8px;">
  <tr style="background-color:#f8f9fa;">
    <td style="border:1px solid #e0e0e0;padding:10px;"><span style="color:#0d6efd;font-weight:bold;font-size:14px;">GET</span><br><span style="color:#555;font-size:11px;margin-top:4px;display:block;">Read data</span></td>
    <td style="border:1px solid #e0e0e0;padding:10px;"><span style="color:#198754;font-weight:bold;font-size:14px;">POST</span><br><span style="color:#555;font-size:11px;margin-top:4px;display:block;">Create resource</span></td>
    <td style="border:1px solid #e0e0e0;padding:10px;"><span style="color:#fd7e14;font-weight:bold;font-size:14px;">PUT</span><br><span style="color:#555;font-size:11px;margin-top:4px;display:block;">Replace resource</span></td>
    <td style="border:1px solid #e0e0e0;padding:10px;"><span style="color:#6f42c1;font-weight:bold;font-size:14px;">PATCH</span><br><span style="color:#555;font-size:11px;margin-top:4px;display:block;">Partial update</span></td>
    <td style="border:1px solid #e0e0e0;padding:10px;"><span style="color:#dc3545;font-weight:bold;font-size:14px;">DELETE</span><br><span style="color:#555;font-size:11px;margin-top:4px;display:block;">Remove resource</span></td>
  </tr>
</table>

<div style="text-align:center;margin-top:0;margin-bottom:25px;font-size:12px;color:#888;">Conference Platform HTTP Methods Reference</div>

-- TOC --
<div style='background-color:#16294E;color:white;padding:8px 16px;font-size:18px;font-weight:bold;border-radius:4px 4px 0 0;margin-bottom:0;margin-top:10px;'>Table of Contents</div>
<table style='width:100%;border-collapse:collapse;font-family:''Helvetica Neue'',Helvetica,Arial,sans-serif;font-size:12px;margin-bottom:10px;'>
  <thead>
    <tr><th style='width:10%;background-color:#F59E0B;color:white;padding:8px 10px;text-align:center;border:1px solid #d9800a;'>#</th><th style='width:75%;background-color:#F59E0B;color:white;padding:8px 10px;text-align:left;border:1px solid #d9800a;'>Section</th><th style='width:15%;background-color:#F59E0B;color:white;padding:8px 10px;text-align:center;border:1px solid #d9800a;'>Endpoints</th></tr>
  </thead>
  <tbody>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>1</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Authentication</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>9</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Profile &amp; Account</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>3</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Catalog &mdash; Categories</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>4</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Catalog &mdash; Destinations</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>5</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Catalog &mdash; Hotels</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>6</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Catalog &mdash; Flights</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>7</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Catalog &mdash; Restaurants</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>8</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Catalog &mdash; Attractions</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>9</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Site &amp; Utilities</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>3</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>10</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Maps</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>11</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Trips</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>6</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>12</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>AI Itinerary Review</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>13</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Favourites &amp; Member Reviews</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>3</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>14</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Surveys</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>5</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>15</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Plans &amp; Subscription</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>5</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>16</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Dashboard</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>3</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>17</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Notifications</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>3</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>18</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Checkout &amp; Payments</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>3</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>19</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>My Reports</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>1</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>20</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Users</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>6</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>21</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Trips</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>4</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>22</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Categories</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>4</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>23</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Countries</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>4</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>24</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Destinations</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>4</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>25</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Hotels</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>4</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>26</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Flights</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>4</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>27</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Restaurants</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>4</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>28</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Attractions</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>4</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>29</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Reviews</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>4</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>30</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Contacts</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>3</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>31</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Plans</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>1</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>32</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Reports</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>3</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>33</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Settings</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>3</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>34</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Analytics</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>2</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>35</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Admin &mdash; Notifications</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>1</td></tr>
    <tr><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>36</td><td style='padding:6px 8px;border:1px solid #e0e0e0;'>Developer &amp; Operations</td><td style='text-align:center;padding:6px 8px;border:1px solid #e0e0e0;'>6</td></tr>
    <tr><td colspan='2' style='font-weight:bold;text-align:right;padding:8px 10px;border:1px solid #e0e0e0;background-color:#fff3e0;color:#16294E;'>Total</td><td style='font-weight:bold;text-align:center;padding:8px 10px;border:1px solid #e0e0e0;background-color:#fff3e0;color:#16294E;'>120</td></tr>
  </tbody>
</table>

<div class="page-break"></div>
<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>1</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Authentication</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/register</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Create a member account: name, email, password. Email verification flow triggered. Throttle: register.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/login</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Authenticate credentials; returns JWT access token (Bearer). Throttle: login (5/60s).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/refresh</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Rotate expired access token. Throttle: 15/1min.</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/logout</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Invalidate current access token.</td></tr>
      <tr><td style='text-align:center;'>5</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/forgot-password</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Send password reset link to email. Throttle: 3/10min.</td></tr>
      <tr><td style='text-align:center;'>6</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/reset-password</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Apply new password with emailed token. Throttle: 5/1min.</td></tr>
      <tr><td style='text-align:center;'>7</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/email/resend</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Resend email verification link. Throttle: 6/1min.</td></tr>
      <tr><td style='text-align:center;'>8</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/email/verify-notice</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Flag/notice page after registration before verification.</td></tr>
      <tr><td style='text-align:center;'>9</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/email/verify/{id}/{hash}</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Verify email via signed URL (Laravel signed routes — tamper-proof).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>2</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Profile &amp; Account</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/user</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Current authenticated profile.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#6f42c1;font-weight:bold;font-size:12px;'>PATCH</span></td><td><code>api/v1/profile</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Update own profile: name, phone, photo, etc.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>3</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Catalog &mdash; Categories</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/categories</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>List travel categories (beaches, mountains, ...).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/categories/{category}</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Single category with stats.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>4</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Catalog &mdash; Destinations</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/destinations</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Browse destinations. Search/filter/pagination.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/destinations/{id}</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Destination detail incl. related hotels, restaurants, attractions.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>5</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Catalog &mdash; Hotels</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/hotels</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>List hotels. Location/price filters; paginated.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/hotels/{id}</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Hotel detail: rating, price, amenities.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>6</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Catalog &mdash; Flights</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/flights</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>List flights. Origin/destination/date filters; paginated.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/flights/{id}</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Flight detail: airline, times, price, class.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>7</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Catalog &mdash; Restaurants</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/restaurants</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>List restaurants. Cuisine/price filters; paginated.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/restaurants/{id}</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Restaurant detail: cuisine, price range, photos.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>8</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Catalog &mdash; Attractions</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/attractions</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>List attractions. Category/destination filters; paginated.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/attractions/{id}</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Attraction detail: description, hours, entry info.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>9</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Site &amp; Utilities</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/site-settings</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Public site settings (branding, contact info). Whitelisted keys only.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/weather</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Weather lookup for destinations (external weather provider).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/contacts</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Contact form submission: name, email, subject, message.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>10</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Maps</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/maps/destination/{destination}</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Map markers for a destination (hotels/restaurants/attractions).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/maps/trip/{trip}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Map data for a member trip.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>11</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Trips</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/trips/create</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Trip builder bootstrap: list of selectable hotels etc.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/trips</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Create a trip: destination, dates, budget, companions, hotel plan.</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/trips/{trip}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Trip detail with itinerary lines (hotel, flights, restaurants, attractions).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/trips/{trip}/fork</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Copy another member's trip into own collection (trip forking).</td></tr>
      <tr><td style='text-align:center;'>5</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/trips/{trip}/attach/{type}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Attach an entity (hotel/flight/restaurant/attraction) to trip. OBSOLETE GATE: controller method missing.</td></tr>
      <tr><td style='text-align:center;'>6</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/trips/{trip}/detach/{id}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Detach an entity from trip. OBSOLETE GATE: controller method missing.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>12</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>AI Itinerary Review</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/review</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Generate AI itinerary/review for a trip (contract: generate ai itineraries).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/review/{id}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Fetch generated AI review.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>13</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Favourites &amp; Member Reviews</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/favourites/{type}/{id}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Add/remove favourite for entity (destinations, hotels...).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/reviews/{type}/{id}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Post a rating + review for entity.</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/reviews/{id}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Delete own review (owner scoped).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>14</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Surveys</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/surveys</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>List own surveys.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/surveys</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Submit a survey response.</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/surveys/{survey}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>View one of own surveys (owner-scoped — IDOR fixed).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/surveys/{survey}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Update own survey (owner-scoped; user_id input stripped).</td></tr>
      <tr><td style='text-align:center;'>5</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/surveys/{survey}</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Delete own survey (owner-scoped).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>15</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Plans &amp; Subscription</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/plans</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>List available plans (perm: get plans).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/me/subscribe</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Subscribe to a plan (perm: subscribe to plans).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/me/upgrade</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Upgrade current plan (perm: upgrade plans).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/me/subscription/cancel</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Cancel subscription (perm: cancel subscription).</td></tr>
      <tr><td style='text-align:center;'>5</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/me/subscription</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Current subscription details (perm: view my subscription).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>16</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Dashboard</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/dashboard</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Member dashboard aggregate: stats, recent trips, upcoming, recommendations.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/dashboard/trips</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Paged member trips for dashboard.</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/dashboard/favourites</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Paged member favourites for dashboard.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>17</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Notifications</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/notifications</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>My notifications; unread_count included. Filter: ?unread_only=.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#6f42c1;font-weight:bold;font-size:12px;'>PATCH</span></td><td><code>api/v1/notifications/read-all</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Mark all my notifications read.</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#6f42c1;font-weight:bold;font-size:12px;'>PATCH</span></td><td><code>api/v1/notifications/{notification}/read</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Mark one notification read (ownership checked).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>18</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Checkout &amp; Payments</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/checkout/initiate</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>Start PayMob checkout for subscription/plan payment; returns payment token &amp; URL.</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/paymob/webhook</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>PayMob webhook; transaction verified by signature before fulfilment.</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/paymob/callback</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>PayMob return URL; finalises payment state for the browser flow.</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>19</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>My Reports</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/me/reports</code></td><td style='text-align:center;'><span style='color:#0e7490;font-weight:bold;font-size:11px;'>USER</span></td><td>My generated report documents (downloads).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>20</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Users</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/users</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List members; filters + pagination (perm: manage users).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/users</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Create user/operator account (perm: manage users).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/users/{user}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>User detail incl. subscription, stats (perm: manage users).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/v1/admin/users/{user}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Update user record (perm: manage users).</td></tr>
      <tr><td style='text-align:center;'>5</td><td style='text-align:center;'><span style='color:#6f42c1;font-weight:bold;font-size:12px;'>PATCH</span></td><td><code>api/v1/admin/users/{user}/active</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Toggle active state (perm: manage users).</td></tr>
      <tr><td style='text-align:center;'>6</td><td style='text-align:center;'><span style='color:#6f42c1;font-weight:bold;font-size:12px;'>PATCH</span></td><td><code>api/v1/admin/users/{user}/block</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Block/unblock user (perm: manage users).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>21</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Trips</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/trips</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List trips with filters + pagination (perm: manage trips).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/trips</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Create a trip (perm: manage trips).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/v1/admin/trips/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Update trip (perm: manage trips).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/admin/trips/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Delete trip (perm: manage trips).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>22</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Categories</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/categories</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List categories (perm: manage categories).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/categories</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Create category (perm: manage categories).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/v1/admin/categories/{category}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Update category (perm: manage categories).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/admin/categories/{category}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Delete category; protection if in use (perm: manage categories).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>23</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Countries</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/countries</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List countries (perm: manage countries).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/countries</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Create country (perm: manage countries).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/v1/admin/countries/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Update country (perm: manage countries).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/admin/countries/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Delete country (perm: manage countries).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>24</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Destinations</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/destinations</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List destinations (perm: manage destinations).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/destinations</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Create destination (perm: manage destinations).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/v1/admin/destinations/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Update destination (perm: manage destinations).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/admin/destinations/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Delete destination; cascade guards (perm: manage destinations).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>25</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Hotels</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/hotels</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List hotels (perm: manage hotels).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/hotels</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Create hotel (perm: manage hotels).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/v1/admin/hotels/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Update hotel (perm: manage hotels).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/admin/hotels/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Delete hotel (perm: manage hotels).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>26</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Flights</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/flights</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List flights (perm: manage flights).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/flights</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Create flight (perm: manage flights).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/v1/admin/flights/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Update flight (perm: manage flights).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/admin/flights/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Delete flight (perm: manage flights).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>27</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Restaurants</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/restaurants</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List restaurants (perm: manage restaurants).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/restaurants</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Create restaurant (perm: manage restaurants).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/v1/admin/restaurants/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Update restaurant (perm: manage restaurants).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/admin/restaurants/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Delete restaurant (perm: manage restaurants).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>28</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Attractions</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/attractions</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List attractions (perm: manage attractions).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/attractions</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Create attraction (perm: manage attractions).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/v1/admin/attractions/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Update attraction (perm: manage attractions).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/admin/attractions/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Delete attraction (perm: manage attractions).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>29</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Reviews</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/reviews</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List reviews, incl. moderation queue (perm: manage reviews).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#6f42c1;font-weight:bold;font-size:12px;'>PATCH</span></td><td><code>api/v1/admin/reviews/{id}/approve</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Approve a review (perm: manage reviews).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#6f42c1;font-weight:bold;font-size:12px;'>PATCH</span></td><td><code>api/v1/admin/reviews/{id}/reject</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Reject a review (perm: manage reviews).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:12px;'>DELETE</span></td><td><code>api/v1/admin/reviews/{id}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Delete a review (perm: manage reviews).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>30</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Contacts</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/contacts</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Inbox of contact messages (perm: manage contacts).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#6f42c1;font-weight:bold;font-size:12px;'>PATCH</span></td><td><code>api/v1/admin/contacts/{id}/read</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Mark contact message read (perm: manage contacts).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#6f42c1;font-weight:bold;font-size:12px;'>PATCH</span></td><td><code>api/v1/admin/contacts/{id}/resolve</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Mark contact message resolved (perm: manage contacts).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>31</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Plans</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/set-plans</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Create/update subscription plans (perm: manage plans).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>32</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Reports</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/reports</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List platform reports (role: admin|super_admin).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#198754;font-weight:bold;font-size:12px;'>POST</span></td><td><code>api/v1/admin/reports/generate</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Generate report document / dataset (role: admin|super_admin).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/reports/{id}/download</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Download generated report file (role: admin|super_admin).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>33</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Settings</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/settings</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>List all site settings (perm: manage settings).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#fd7e14;font-weight:bold;font-size:12px;'>PUT</span></td><td><code>api/v1/admin/settings</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Bulk update settings (perm: manage settings).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#6f42c1;font-weight:bold;font-size:12px;'>PATCH</span></td><td><code>api/v1/admin/settings/{key}</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Update single setting key (perm: manage settings).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>34</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Analytics</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/analytics</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Platform analytics aggregate (perm: view analytics).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/analytics/revenue</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Revenue analytics (perm: view analytics).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>35</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Admin &mdash; Notifications</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>api/v1/admin/notifications</code></td><td style='text-align:center;'><span style='color:#dc3545;font-weight:bold;font-size:11px;'>ADMIN</span></td><td>Send/broadcast platform notification (role: admin|super_admin).</td></tr>
    </tbody>
  </table>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>36</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Developer &amp; Operations</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:center;width:10%;'>Method</th><th style='text-align:left;width:35%;'>Endpoint</th><th style='text-align:center;width:8%;'>Access</th><th style='text-align:left;width:42%;'>Description</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>docs/api</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Scramble-generated OpenAPI documentation UI (restricted).</td></tr>
      <tr><td style='text-align:center;'>2</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>docs/api.json</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>OpenAPI JSON spec (restricted).</td></tr>
      <tr><td style='text-align:center;'>3</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>mail-preview/{type}</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Mail preview endpoint (local/dev only).</td></tr>
      <tr><td style='text-align:center;'>4</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>storage/{path}</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Serve uploaded media (PUT shows/overwrites preview).</td></tr>
      <tr><td style='text-align:center;'>5</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>up</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Health check heartbeat.</td></tr>
      <tr><td style='text-align:center;'>6</td><td style='text-align:center;'><span style='color:#0d6efd;font-weight:bold;font-size:12px;'>GET</span></td><td><code>/</code></td><td style='text-align:center;'><span style='color:#16294E;font-weight:bold;font-size:11px;'>&mdash;</span></td><td>Frontend entry root.</td></tr>
    </tbody>
  </table>
</div>

<div class="page-break"></div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>&#127760;</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Part II &mdash; Website Platform Documentation</div>
  </div>

  <div style='margin-top:10px;margin-bottom:10px;padding:10px 14px;background-color:#fff8e6;border-left:4px solid #F59E0B;font-size:13px;color:#16294E;'><strong>Product:</strong> Conference planning platform in which members build travel itineraries (destinations, hotel, flight, restaurants, attractions), get AI-generated itinerary reviews, pick subscription plans and pay via PayMob. Operators control content, members and analytics from the admin panel. All flows below map 1:1 to the API endpoints in Part I.</div>

  <table>
    <thead>
      <tr><th style='text-align:center;width:5%;'>#</th><th style='text-align:left;width:30%;'>Area / Page</th><th style='text-align:left;width:65%;'>What is documented</th></tr>
    </thead>
    <tbody>
      <tr><td style='text-align:center;'>1</td><td><strong>Authentication</strong></td><td>Sign up &rarr; verify email (signed URL) &rarr; login &rarr; JWT stored &rarr; logout / refresh. Throttled public endpoints.</td></tr>
      <tr><td style='text-align:center;'>2</td><td><strong>Public catalog</strong></td><td>Home + browse pages: categories, destinations with detail pages (hotel/flight/restaurant/attraction cards), search/filter &amp; pagination, weather widget.</td></tr>
      <tr><td style='text-align:center;'>3</td><td><strong>Trip builder</strong></td><td>Create trip (form), attach hotels / flights / restaurants / attractions, detach, view personal itinerary, fork a shared trip into your library.</td></tr>
      <tr><td style='text-align:center;'>4</td><td><strong>AI itinerary review</strong></td><td>Generate AI review of a trip plan and read the result.</td></tr>
      <tr><td style='text-align:center;'>5</td><td><strong>Favourites &amp; reviews</strong></td><td>Favourite toggle, submit review, review moderation status visible to member.</td></tr>
      <tr><td style='text-align:center;'>6</td><td><strong>Plans &amp; subscription</strong></td><td>Browse plans &rarr; subscribe &rarr; upgrade &rarr; cancel &rarr; subscription state on dashboard/profile.</td></tr>
      <tr><td style='text-align:center;'>7</td><td><strong>Checkout &amp; payments</strong></td><td>PayMob checkout: initiate &rarr; PayMob hosted page &rarr; webhook fulfilment &rarr; callback return. Signature-verified.</td></tr>
      <tr><td style='text-align:center;'>8</td><td><strong>Member dashboard</strong></td><td>Stats, recent trips, pinned favourites, reports &amp; downloads.</td></tr>
      <tr><td style='text-align:center;'>9</td><td><strong>Surveys</strong></td><td>Answer / edit / delete own surveys (IDOR-protected, owner-scoped).</td></tr>
      <tr><td style='text-align:center;'>10</td><td><strong>Notifications</strong></td><td>Inbox with unread counter; read all or single.</td></tr>
      <tr><td style='text-align:center;'>11</td><td><strong>Contact form</strong></td><td>Public contact submission; admin inbox with read/resolve workflow.</td></tr>
      <tr><td style='text-align:center;'>12</td><td><strong>Admin panel</strong></td><td>Users, trips, categories/countries/destinations/hotels/flights/restaurants/attractions CRUD, reviews moderation, plans management, settings, analytics, reports generation/download, notifications broadcast. Every admin action gated by <code>permission:</code> or <code>role:</code> middleware.</td></tr>
      <tr><td style='text-align:center;'>13</td><td><strong>Developer / ops</strong></td><td>Interactive docs (Scramble/OpenAPI), health check <code>/up</code>, storage preview, mail preview in dev. Telescope available in local env for request profiling.</td></tr>
    </tbody>
  </table>
  <p style="font-size:11px;color:#888;margin-top:6px;">Permissions seeded: 28 route permissions; roles <code>super_admin</code> / <code>admin</code> / <code>user</code>. All operator routes also require <code>auth:api</code>.</p>
</div>

<div class='module-section'>
  <div style='display:flex;margin-top:15px;border-radius:4px 4px 0 0;overflow:hidden;align-items:stretch;'>
    <div style='background-color:#F59E0B;color:white;font-size:20px;font-weight:bold;padding:8px 20px;display:flex;align-items:center;justify-content:center;'>&#128274;</div>
    <div style='background-color:#16294E;color:white;font-size:18px;font-weight:bold;padding:8px 16px;flex-grow:1;display:flex;align-items:center;'>Appendix &mdash; Security Model</div>
  </div>

  <table>
    <thead>
      <tr><th style='text-align:left;width:30%;'>Mechanism</th><th style='text-align:left;width:70%;'>Where it applies</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>auth:api</strong></td><td>Every member and operator route; JWT bearer.</td></tr>
      <tr><td><strong>permission:</strong> middleware</td><td>Operator CRUD + member plan flows (28 seeded permissions on guard <code>api</code>).</td></tr>
      <tr><td><strong>role:</strong> middleware</td><td>Reports + admin notifications restricted to <code>admin|super_admin</code>.</td></tr>
      <tr><td><strong>Owner scoping</strong></td><td>Surveys, notifications, reviews, favourites, reports scoped by context user id.</td></tr>
      <tr><td><strong>Throttles</strong></td><td>register, login, refresh, password endpoints, email resend.</td></tr>
      <tr><td><strong>Signed verification URL</strong></td><td>Email verify route hash checks.</td></tr>
      <tr><td><strong>Signature verification</strong></td><td>PayMob webhooks validated before fulfilment.</td></tr>
    </tbody>
  </table>

  <div style="margin-top:8px;margin-bottom:0;padding:8px 12px;background-color:#fdecea;border-left:4px solid #dc3545;font-size:12px;color:#842029;"><strong>Known / flagged gaps:</strong> attach/detach routes point to missing controller methods (currently return 500 — either implement or remove); <code>GET review/{id}</code> + <code>GET maps/trip</code> could benefit from an explicit owner check; contacts endpoint public without throttle (recommend adding); <code>site-settings</code> public (whitelist keys).</div>
</div>

<p style='font-size:11px;color:#999;margin-top:20px;'>Generated by Team 2 &mdash; Conference Case Study &mdash; August 9, 2026 &mdash; from <code>php artisan route:list -v --json</code>; auditing of every route against seeded permissions &amp; owner checks.</p>

