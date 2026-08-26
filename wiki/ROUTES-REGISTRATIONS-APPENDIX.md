# Appendix — Raw Route Registrations (237 lines, `routes/api.php`)

> **237 `Route::` registrations** in `routes/api.php` (499 lines) — includes `group`/`prefix`/`middleware` wrappers (29) and `apiResource` (2 → 10 deployed). Deployed `api/*` is **213** (222 total) — see [`ROUTES-APPENDIX.md`](ROUTES-APPENDIX.md) for the 213 deployed table. Audited `rg -c "Route::"` 2026-08-23.

| # | Line | Code (trimmed) |
|---|---|---|
| 1 | 60 | `Route::get('/auth/google', [AuthController::class, 'googleRegister']);` |
| 2 | 61 | `Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);` |
| 3 | 63 | `Route::get('/auth/facebook', [AuthController::class, 'facebookRedirect']);` |
| 4 | 64 | `Route::get('/auth/facebook/callback', [AuthController::class, 'facebookCallback']);` |
| 5 | 67 | `Route::post('/register', [AuthController::class, 'register'])->middleware(['throttle:register']);` |
| 6 | 68 | `Route::post('/login', [AuthController::class, 'login'])->middleware(['throttle:login'])->name('login');` |
| 7 | 69 | `Route::post('/forgot-password', [AuthController::class, 'forgetPassword'])->middleware(['throttle:3,10']);` |
| 8 | 70 | `Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware(['throttle:5,1'])->name('password.reset');` |
| 9 | 73 | `Route::post('/auth/social/complete', [AuthController::class, 'completeSocialRegistration'])->middleware(['auth:api']);` |
| 10 | 76 | `Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])` |
| 11 | 82 | `Route::middleware(['auth:api'])->group(function () {` |
| 12 | 83 | `Route::get('/user', [AuthController::class, 'me']);` |
| 13 | 84 | `Route::get('/me', [AuthController::class, 'me']);` |
| 14 | 85 | `Route::post('/logout', [AuthController::class, 'logout']);` |
| 15 | 86 | `Route::post('/refresh', [AuthController::class, 'refresh'])->middleware(['throttle:15,1']);` |
| 16 | 87 | `Route::get('/email/verify-notice', [AuthController::class, 'verificationNotice'])` |
| 17 | 89 | `Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])` |
| 18 | 92 | `Route::match(['patch', 'post'], '/profile', [AuthController::class, 'updateProfile']);` |
| 19 | 95 | `Route::middleware(['auth:api', 'verified'])->group(function () {` |
| 20 | 96 | `Route::apiResource('trips', TripController::class);` |
| 21 | 100 | `Route::middleware(['auth:api', 'verified'])->prefix('admin')->name('admin.')->group(function () {` |
| 22 | 101 | `Route::get('/users', [AdminUserController::class, 'index'])->middleware('permission:manage users');` |
| 23 | 102 | `Route::get('/users/{user}', [AdminUserController::class, 'show'])->middleware('permission:manage users');` |
| 24 | 103 | `Route::post('/users', [AdminUserController::class, 'store'])->middleware('permission:manage users');` |
| 25 | 104 | `Route::put('/users/{user}', [AdminUserController::class, 'update'])->middleware('permission:manage users');` |
| 26 | 105 | `Route::patch('/users/{user}/active', [AdminUserController::class, 'active'])->middleware('permission:manage users');` |
| 27 | 106 | `Route::patch('/users/{user}/block', [AdminUserController::class, 'block'])->middleware('permission:manage users');` |
| 28 | 114 | `Route::group([], function () {` |
| 29 | 116 | `Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');` |
| 30 | 117 | `Route::get('/categories/{category}', [CategoryController::class, 'show'])->name('categories.show');` |
| 31 | 120 | `Route::get('/countries', [CountryController::class, 'index']);` |
| 32 | 121 | `Route::get('/countries/{id}', [CountryController::class, 'show']);` |
| 33 | 122 | `Route::get('/cities', [CountryController::class, 'cities']);` |
| 34 | 125 | `Route::get('/destinations', [DestinationController::class, 'index']);` |
| 35 | 126 | `Route::get('/destinations/{id}', [DestinationController::class, 'show']);` |
| 36 | 127 | `Route::get('/destinations/{destination}/hotels', [HotelController::class, 'byDestination']);` |
| 37 | 130 | `Route::get('/hotels', [HotelController::class, 'index']);` |
| 38 | 131 | `Route::get('/hotels/{id}', [HotelController::class, 'show']);` |
| 39 | 132 | `Route::get('/hotels/{hotel}/reviews', [HotelController::class, 'reviews']);` |
| 40 | 135 | `Route::get('/regions', [RegionController::class, 'index']);` |
| 41 | 138 | `Route::get('/stats/summary', [StatsController::class, 'summary']);` |
| 42 | 141 | `Route::get('/flights', [FlightController::class, 'index']);` |
| 43 | 142 | `Route::get('/flights/{id}', [FlightController::class, 'show']);` |
| 44 | 145 | `Route::get('/restaurants', [RestaurantController::class, 'index']);` |
| 45 | 146 | `Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);` |
| 46 | 149 | `Route::get('/attractions', [AttractionController::class, 'index']);` |
| 47 | 150 | `Route::get('/attractions/{id}', [AttractionController::class, 'show']);` |
| 48 | 153 | `Route::get('/reviews/{type}/{id}', [InteractionController::class, 'getEntityReviews']);` |
| 49 | 156 | `Route::get('/site-settings', [SiteSettingsController::class, 'index'])->name('site-settings.index');` |
| 50 | 160 | `Route::middleware(['auth:api'])->group(function () {` |
| 51 | 161 | `Route::post('/destinations/{destination}/book', [DestinationController::class, 'book']);` |
| 52 | 165 | `Route::prefix('v1')->group(function () {` |
| 53 | 166 | `Route::get('/countries', [CountryController::class, 'index']);` |
| 54 | 167 | `Route::get('/countries/{id}', [CountryController::class, 'show']);` |
| 55 | 168 | `Route::get('/cities', [CountryController::class, 'cities']);` |
| 56 | 169 | `Route::get('/destinations', [DestinationController::class, 'index']);` |
| 57 | 170 | `Route::get('/destinations/{id}', [DestinationController::class, 'show']);` |
| 58 | 171 | `Route::get('/destinations/{destination}/hotels', [HotelController::class, 'byDestination']);` |
| 59 | 172 | `Route::get('/hotels', [HotelController::class, 'index']);` |
| 60 | 173 | `Route::get('/hotels/{id}', [HotelController::class, 'show']);` |
| 61 | 174 | `Route::get('/hotels/{hotel}/reviews', [HotelController::class, 'reviews']);` |
| 62 | 175 | `Route::get('/restaurants', [RestaurantController::class, 'index']);` |
| 63 | 176 | `Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);` |
| 64 | 177 | `Route::get('/attractions', [AttractionController::class, 'index']);` |
| 65 | 178 | `Route::get('/attractions/{id}', [AttractionController::class, 'show']);` |
| 66 | 179 | `Route::get('/flights', [FlightController::class, 'index']);` |
| 67 | 180 | `Route::get('/flights/{id}', [FlightController::class, 'show']);` |
| 68 | 181 | `Route::get('/regions', [RegionController::class, 'index']);` |
| 69 | 182 | `Route::get('/stats/summary', [StatsController::class, 'summary']);` |
| 70 | 183 | `Route::get('/weather', [WeatherController::class, 'show'])->middleware('throttle:weather');` |
| 71 | 184 | `Route::middleware(['auth:api'])->post('/destinations/{destination}/book', [DestinationController::class, 'book']);` |
| 72 | 185 | `Route::middleware(['auth:api', 'verified'])->group(function () {` |
| 73 | 186 | `Route::get('/trips', [TripController::class, 'index']);` |
| 74 | 187 | `Route::get('/trips/{trip}', [TripController::class, 'show']);` |
| 75 | 188 | `Route::post('/trips', [TripController::class, 'store']);` |
| 76 | 189 | `Route::put('/trips/{trip}', [TripController::class, 'update']);` |
| 77 | 190 | `Route::delete('/trips/{trip}', [TripController::class, 'destroy']);` |
| 78 | 191 | `Route::get('/review/{id}', [AIController::class, 'review']);` |
| 79 | 192 | `Route::get('/ai/review/{id}', [AIController::class, 'review']);` |
| 80 | 193 | `Route::post('/review/{id}', [AIController::class, 'review']);` |
| 81 | 194 | `Route::post('/ai/review/{id}', [AIController::class, 'review']);` |
| 82 | 199 | `Route::middleware(['auth:api', 'verified'])->prefix('admin')->name('admin.')->group(function () {` |
| 83 | 201 | `Route::get('/categories', [AdminCategoryController::class, 'index'])` |
| 84 | 203 | `Route::post('/categories', [AdminCategoryController::class, 'store'])` |
| 85 | 205 | `Route::put('/categories/{category}', [AdminCategoryController::class, 'update'])` |
| 86 | 207 | `Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])` |
| 87 | 209 | `Route::patch('/categories/{id}/restore', [AdminCategoryController::class, 'restore'])` |
| 88 | 213 | `Route::get('/countries', [AdminCountryController::class, 'index'])->middleware('permission:manage countries');` |
| 89 | 214 | `Route::post('/countries', [AdminCountryController::class, 'store'])->middleware('permission:manage countries');` |
| 90 | 215 | `Route::put('/countries/{id}', [AdminCountryController::class, 'update'])->middleware('permission:manage countries');` |
| 91 | 216 | `Route::delete('/countries/{id}', [AdminCountryController::class, 'destroy'])->middleware('permission:manage countries');` |
| 92 | 217 | `Route::patch('/countries/{id}/restore', [AdminCountryController::class, 'restore'])->middleware('permission:manage countries');` |
| 93 | 220 | `Route::get('/destinations', [AdminDestinationController::class, 'index'])` |
| 94 | 222 | `Route::post('/destinations', [AdminDestinationController::class, 'store'])` |
| 95 | 224 | `Route::put('/destinations/{id}', [AdminDestinationController::class, 'update'])` |
| 96 | 226 | `Route::delete('/destinations/{id}', [AdminDestinationController::class, 'destroy'])` |
| 97 | 228 | `Route::patch('/destinations/{id}/restore', [AdminDestinationController::class, 'restore'])` |
| 98 | 232 | `Route::get('/flights', [AdminFlightController::class, 'index'])` |
| 99 | 234 | `Route::post('/flights', [AdminFlightController::class, 'store'])` |
| 100 | 236 | `Route::put('/flights/{id}', [AdminFlightController::class, 'update'])` |
| 101 | 238 | `Route::delete('/flights/{id}', [AdminFlightController::class, 'destroy'])` |
| 102 | 240 | `Route::patch('/flights/{id}/restore', [AdminFlightController::class, 'restore'])` |
| 103 | 244 | `Route::get('/hotels', [AdminHotelController::class, 'index'])->middleware('permission:manage hotels');` |
| 104 | 245 | `Route::post('/hotels', [AdminHotelController::class, 'store'])->middleware('permission:manage hotels');` |
| 105 | 246 | `Route::put('/hotels/{id}', [AdminHotelController::class, 'update'])->middleware('permission:manage hotels');` |
| 106 | 247 | `Route::delete('/hotels/{id}', [AdminHotelController::class, 'destroy'])->middleware('permission:manage hotels');` |
| 107 | 248 | `Route::patch('/hotels/{id}/restore', [AdminHotelController::class, 'restore'])->middleware('permission:manage hotels');` |
| 108 | 251 | `Route::get('/attractions', [AdminAttractionController::class, 'index'])->middleware('permission:manage attractions');` |
| 109 | 252 | `Route::post('/attractions', [AdminAttractionController::class, 'store'])->middleware('permission:manage attractions');` |
| 110 | 253 | `Route::put('/attractions/{id}', [AdminAttractionController::class, 'update'])->middleware('permission:manage attractions');` |
| 111 | 254 | `Route::delete('/attractions/{id}', [AdminAttractionController::class, 'destroy'])->middleware('permission:manage attractions');` |
| 112 | 255 | `Route::patch('/attractions/{id}/restore', [AdminAttractionController::class, 'restore'])->middleware('permission:manage attractions');` |
| 113 | 258 | `Route::get('/restaurants', [AdminRestaurantController::class, 'index'])->middleware('permission:manage restaurants');` |
| 114 | 259 | `Route::post('/restaurants', [AdminRestaurantController::class, 'store'])->middleware('permission:manage restaurants');` |
| 115 | 260 | `Route::put('/restaurants/{id}', [AdminRestaurantController::class, 'update'])->middleware('permission:manage restaurants');` |
| 116 | 261 | `Route::delete('/restaurants/{id}', [AdminRestaurantController::class, 'destroy'])->middleware('permission:manage restaurants');` |
| 117 | 262 | `Route::patch('/restaurants/{id}/restore', [AdminRestaurantController::class, 'restore'])->middleware('permission:manage restaurants');` |
| 118 | 270 | `Route::group([], function () {` |
| 119 | 271 | `Route::get('/maps/destination/{destination}', [MapController::class, 'destination'])->middleware('throttle:maps');` |
| 120 | 272 | `Route::get('/maps/trip/{trip}', [MapController::class, 'trip'])->middleware(['auth:api', 'verified']);` |
| 121 | 276 | `Route::middleware(['auth:api', 'verified'])->prefix('trips')->group(function () {` |
| 122 | 277 | `Route::get('/create', [TripController::class, 'creationData']);` |
| 123 | 278 | `Route::post('/', [TripController::class, 'store']);` |
| 124 | 279 | `Route::post('/{trip}/attach/{type}', [TripController::class, 'attach']);` |
| 125 | 280 | `Route::put('/{trip}/items/{id}', [TripController::class, 'updateItem']);` |
| 126 | 281 | `Route::delete('/{trip}/detach/{id}', [TripController::class, 'detach']);` |
| 127 | 284 | `Route::post('/{trip}/fork', [TripController::class, 'fork']);` |
| 128 | 288 | `Route::get('/trips/{trip}', [TripController::class, 'show'])->middleware(['auth:api', 'verified']);` |
| 129 | 291 | `Route::middleware(['auth:api', 'verified', 'throttle:ai'])->group(function () {` |
| 130 | 292 | `Route::post('/trips/{trip}/concierge', [ConciergeController::class, 'ask']);` |
| 131 | 296 | `Route::middleware(['auth:api', 'verified'])->group(function () {` |
| 132 | 297 | `Route::get('/conversations', [ConversationController::class, 'index']);` |
| 133 | 298 | `Route::post('/conversations', [ConversationController::class, 'store']);` |
| 134 | 299 | `Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);` |
| 135 | 300 | `Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages']);` |
| 136 | 301 | `Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);` |
| 137 | 302 | `Route::patch('/conversations/{conversation}/read', [ConversationController::class, 'markAsRead']);` |
| 138 | 306 | `Route::middleware(['auth:api', 'verified'])->group(function () {` |
| 139 | 307 | `Route::get('/me/reviews', [InteractionController::class, 'myReviews']);` |
| 140 | 308 | `Route::get('/reviews/my', [InteractionController::class, 'myReviews']);` |
| 141 | 309 | `Route::post('/favourites/{type}/{id}', [InteractionController::class, 'toggleFavourite']);` |
| 142 | 310 | `Route::post('/reviews/{type}/{id}', [InteractionController::class, 'storeReview']);` |
| 143 | 311 | `Route::delete('/reviews/{id}', [InteractionController::class, 'destroyReview']);` |
| 144 | 315 | `Route::post('/enhance', [AIController::class, 'enhance'])->middleware(['auth:api', 'verified', 'throttle:ai']);` |
| 145 | 316 | `Route::post('/review', [AIController::class, 'generate'])` |
| 146 | 318 | `Route::post('/trips/generate-ai', [AIController::class, 'generate'])` |
| 147 | 320 | `Route::post('/trips/ai-generate', [AIController::class, 'generate'])` |
| 148 | 322 | `Route::post('/ai/plan', [AIController::class, 'generate'])` |
| 149 | 324 | `Route::get('/review/{id}', [AIController::class, 'review'])` |
| 150 | 326 | `Route::get('/ai/review/{id}', [AIController::class, 'review'])` |
| 151 | 328 | `Route::post('/review/{id}', [AIController::class, 'review'])` |
| 152 | 330 | `Route::post('/ai/review/{id}', [AIController::class, 'review'])` |
| 153 | 334 | `Route::middleware(['auth:api', 'verified'])->prefix('admin')->name('admin.')->group(function () {` |
| 154 | 336 | `Route::get('/trips', [AdminTripController::class, 'index'])->middleware('permission:manage trips');` |
| 155 | 337 | `Route::post('/trips', [AdminTripController::class, 'store'])->middleware('permission:manage trips');` |
| 156 | 338 | `Route::put('/trips/{id}', [AdminTripController::class, 'update'])->middleware('permission:manage trips');` |
| 157 | 339 | `Route::delete('/trips/{id}', [AdminTripController::class, 'destroy'])->middleware('permission:manage trips');` |
| 158 | 340 | `Route::patch('/trips/{id}/restore', [AdminTripController::class, 'restore'])->middleware('permission:manage trips');` |
| 159 | 343 | `Route::get('/reviews', [AdminReviewController::class, 'index'])->middleware('permission:manage reviews');` |
| 160 | 344 | `Route::patch('/reviews/{id}/approve', [AdminReviewController::class, 'approve'])->middleware('permission:manage reviews');` |
| 161 | 345 | `Route::patch('/reviews/{id}/reject', [AdminReviewController::class, 'reject'])->middleware('permission:manage reviews');` |
| 162 | 346 | `Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy'])->middleware('permission:manage reviews');` |
| 163 | 347 | `Route::patch('/reviews/{id}/restore', [AdminReviewController::class, 'restore'])->middleware('permission:manage reviews');` |
| 164 | 349 | `Route::get('/flags', [AdminFlagController::class, 'index'])->middleware('role:admin\|super_admin');` |
| 165 | 350 | `Route::post('/flags/{id}/approve', [AdminFlagController::class, 'approve'])->middleware('role:admin\|super_admin');` |
| 166 | 351 | `Route::post('/flags/{id}/decline', [AdminFlagController::class, 'decline'])->middleware('role:admin\|super_admin');` |
| 167 | 359 | `Route::get('/plans', [PlanController::class, 'index']);` |
| 168 | 360 | `Route::get('/plans/{id}', [PlanController::class, 'show']);` |
| 169 | 363 | `Route::middleware(['auth:api', 'verified'])->name('plans.')->group(function () {` |
| 170 | 364 | `Route::post('/admin/set-plans', [PlanController::class, 'setPlans'])` |
| 171 | 367 | `Route::post('/me/subscribe', [PlanController::class, 'subscribe'])` |
| 172 | 369 | `Route::post('/me/upgrade', [PlanController::class, 'upgrade'])` |
| 173 | 371 | `Route::post('/me/subscription/cancel', [PlanController::class, 'cancel'])` |
| 174 | 373 | `Route::get('/me/subscription', [PlanController::class, 'subscription'])` |
| 175 | 378 | `Route::middleware(['auth:api', 'verified'])->prefix('checkout')->name('checkout.')->group(function () {` |
| 176 | 379 | `Route::post('/initiate', [CheckoutController::class, 'initiate'])` |
| 177 | 384 | `Route::prefix('paymob')->name('paymob-v1.')->group(function () {` |
| 178 | 385 | `Route::post('/webhook', [PaymobWebhookController::class, 'handle'])->name('webhook');` |
| 179 | 386 | `Route::get('/callback', [PaymobWebhookController::class, 'callback'])->name('callback');` |
| 180 | 390 | `Route::post('/paymob/webhook', [PaymobWebhookController::class, 'handle'])->name('paymob-v1.webhook');` |
| 181 | 391 | `Route::get('/paymob/callback', [PaymobWebhookController::class, 'callback'])->name('paymob-v1.callback');` |
| 182 | 393 | `Route::prefix('v1/paymob')->group(function () {` |
| 183 | 394 | `Route::post('/webhook', [PaymobWebhookController::class, 'handle']);` |
| 184 | 395 | `Route::get('/callback', [PaymobWebhookController::class, 'callback']);` |
| 185 | 399 | `Route::middleware(['auth:api', 'verified'])->prefix('admin')->name('admin.')->group(function () {` |
| 186 | 400 | `Route::get('/analytics/revenue', [AdminAnalyticsController::class, 'revenue'])` |
| 187 | 402 | `Route::get('/analytics', [AdminAnalyticsController::class, 'index'])` |
| 188 | 411 | `Route::post('/contacts', [ContactController::class, 'store'])->middleware('throttle:contacts');` |
| 189 | 412 | `Route::post('/newsletter/subscribe', [NewsletterController::class, 'store'])->middleware('throttle:newsletter');` |
| 190 | 413 | `Route::get('/weather', [WeatherController::class, 'show'])->middleware('throttle:weather');` |
| 191 | 416 | `Route::middleware(['auth:api', 'verified'])->group(function () {` |
| 192 | 417 | `Route::apiResource('surveys', SurveyController::class);` |
| 193 | 421 | `Route::middleware(['auth:api', 'verified'])->prefix('dashboard')->name('dashboard.')->group(function () {` |
| 194 | 422 | `Route::get('/', [DashboardController::class, 'index'])->name('index');` |
| 195 | 423 | `Route::get('/trips', [DashboardController::class, 'trips'])->name('trips');` |
| 196 | 424 | `Route::get('/favourites', [DashboardController::class, 'favourites'])->name('favourites');` |
| 197 | 425 | `Route::get('/orders', [DashboardController::class, 'orders'])->name('orders');` |
| 198 | 428 | `Route::middleware(['auth:api', 'verified'])->group(function () {` |
| 199 | 429 | `Route::get('/orders', [DashboardController::class, 'orders']);` |
| 200 | 430 | `Route::get('/me/orders', [DashboardController::class, 'orders']);` |
| 201 | 431 | `Route::get('/orders/lookup/{orderRef}', [DashboardController::class, 'lookupOrder']);` |
| 202 | 432 | `Route::get('/me/ai-quota', [DashboardController::class, 'aiQuota']);` |
| 203 | 433 | `Route::get('/ai/quota', [DashboardController::class, 'aiQuota']);` |
| 204 | 437 | `Route::middleware(['auth:api', 'verified'])->prefix('notifications')->name('notifications.')->group(function () {` |
| 205 | 438 | `Route::get('/', [NotificationController::class, 'index']);` |
| 206 | 439 | `Route::patch('/read-all', [NotificationController::class, 'markAllAsRead']);` |
| 207 | 440 | `Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead']);` |
| 208 | 444 | `Route::middleware(['auth:api', 'verified'])->group(function () {` |
| 209 | 445 | `Route::get('/me/reports', [ReportController::class, 'myReports']);` |
| 210 | 449 | `Route::middleware(['auth:api', 'verified', 'role:admin\|super_admin'])->prefix('admin/notifications')->name('admin.notifications.')->grou...` |
| 211 | 450 | `Route::get('/', [AdminNotificationController::class, 'index']);` |
| 212 | 453 | `Route::middleware(['auth:api', 'verified'])->prefix('admin')->name('admin.')->group(function () {` |
| 213 | 455 | `Route::get('/contacts', [ContactMessageController::class, 'index'])` |
| 214 | 457 | `Route::patch('/contacts/{id}/read', [ContactMessageController::class, 'markAsRead'])` |
| 215 | 459 | `Route::patch('/contacts/{id}/resolve', [ContactMessageController::class, 'markAsResolved'])` |
| 216 | 463 | `Route::get('/settings', [SettingController::class, 'index'])` |
| 217 | 465 | `Route::put('/settings', [SettingController::class, 'update'])` |
| 218 | 467 | `Route::patch('/settings/{key}', [SettingController::class, 'patchKey'])` |
| 219 | 472 | `Route::middleware(['auth:api', 'verified', 'role:admin\|super_admin'])` |
| 220 | 475 | `Route::get('/reports', [ReportController::class, 'index']);` |
| 221 | 476 | `Route::post('/reports/generate', [ReportController::class, 'generate']);` |
| 222 | 477 | `Route::get('/reports/{id}/download', [ReportController::class, 'download']);` |
| 223 | 480 | `Route::middleware(['auth:api'])->group(function () {` |
| 224 | 481 | `Route::post('/agency-requests', [AgencyRequestController::class, 'store']);` |
| 225 | 482 | `Route::get('/admin/agency-requests', [AdminAgencyController::class, 'adminIndex'])` |
| 226 | 485 | `Route::post('/admin/agency-requests/{assignment}/approve', [AdminAgencyController::class, 'approve'])->middleware('role:admin\|super_admi...` |
| 227 | 486 | `Route::post('/agency/assignments/{assignment}/approve', [AgencyAssignmentController::class, 'approve'])->middleware('role:agency\|admin\|...` |
| 228 | 487 | `Route::post('/agency/assignments/{assignment}/decline', [AgencyAssignmentController::class, 'decline'])->middleware('role:agency\|admin\|...` |
| 229 | 488 | `Route::post('/agency/assignments/{assignment}/trips', [AgencyAssignmentController::class, 'createTrip'])->middleware('role:agency\|admin\...` |
| 230 | 489 | `Route::get('/agency/assignments', [AgencyAssignmentController::class, 'index'])->middleware('role:agency\|admin\|super_admin');` |
| 231 | 490 | `Route::get('/agency/trips', [AgencyAssignmentController::class, 'trips'])->middleware('role:agency\|admin\|super_admin');` |
| 232 | 491 | `Route::get('/agency/earnings', [AgencyAssignmentController::class, 'earnings'])->middleware('role:agency\|admin\|super_admin');` |
| 233 | 492 | `Route::get('/agency/profile', [AgencyAssignmentController::class, 'getProfile'])->middleware('role:agency\|admin\|super_admin');` |
| 234 | 493 | `Route::put('/agency/profile', [AgencyAssignmentController::class, 'updateProfile'])->middleware('role:agency\|admin\|super_admin');` |
| 235 | 494 | `Route::get('/agency-assignments', [AgencyAssignmentController::class, 'myAssignments']);` |
| 236 | 495 | `Route::post('/agency-assignments/{assignment}/cancel', [AgencyAssignmentController::class, 'cancel']);` |
| 237 | 498 | `Route::post('/agency-assignments/{assignment}/report', [FlagController::class, 'store'])->middleware(['auth:api']);` |

**Counts:** registrations 237 = `get:105` `post:56` `put:13` `patch:19` `delete:12` `apiResource:2` + `group/prefix/middleware:29` wrappers. Deployed `api/*` 213 = registrations minus wrappers plus `apiResource` expansion.