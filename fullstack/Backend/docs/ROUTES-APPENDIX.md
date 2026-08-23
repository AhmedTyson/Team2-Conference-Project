# Appendix — Full API Route List (213 routes, generated 2026-08-23)

> Generated via `php artisan route:list --json` — 213 `api/*` routes (total 222 incl. web/docs/storage/up).

| # | Method | URI | Action | Middleware |
|---|---|---|---|---|
| 1 | GET | `api/admin/agency-requests` | `Commerce\AdminAgencyController@adminIndex` | api, auth:api, role:admin\|super_admin |
| 2 | POST | `api/admin/agency-requests/{assignment}/approve` | `Commerce\AdminAgencyController@approve` | api, auth:api, role:admin\|super_admin |
| 3 | GET | `api/admin/analytics` | `Commerce\AdminAnalyticsController@index` | api, auth:api, verified, permission:view analytics |
| 4 | GET | `api/admin/analytics/revenue` | `Commerce\AdminAnalyticsController@revenue` | api, auth:api, verified, permission:view analytics |
| 5 | GET | `api/admin/attractions` | `Catalog\AdminAttractionController@index` | api, auth:api, verified, permission:manage attractions |
| 6 | POST | `api/admin/attractions` | `Catalog\AdminAttractionController@store` | api, auth:api, verified, permission:manage attractions |
| 7 | PUT | `api/admin/attractions/{id}` | `Catalog\AdminAttractionController@update` | api, auth:api, verified, permission:manage attractions |
| 8 | DELETE | `api/admin/attractions/{id}` | `Catalog\AdminAttractionController@destroy` | api, auth:api, verified, permission:manage attractions |
| 9 | PATCH | `api/admin/attractions/{id}/restore` | `Catalog\AdminAttractionController@restore` | api, auth:api, verified, permission:manage attractions |
| 10 | GET | `api/admin/categories` | `Catalog\AdminCategoryController@index` | api, auth:api, verified, permission:manage categories |
| 11 | POST | `api/admin/categories` | `Catalog\AdminCategoryController@store` | api, auth:api, verified, permission:manage categories |
| 12 | PUT | `api/admin/categories/{category}` | `Catalog\AdminCategoryController@update` | api, auth:api, verified, permission:manage categories |
| 13 | DELETE | `api/admin/categories/{category}` | `Catalog\AdminCategoryController@destroy` | api, auth:api, verified, permission:manage categories |
| 14 | PATCH | `api/admin/categories/{id}/restore` | `Catalog\AdminCategoryController@restore` | api, auth:api, verified, permission:manage categories |
| 15 | GET | `api/admin/contacts` | `System\ContactMessageController@index` | api, auth:api, verified, permission:manage contacts |
| 16 | PATCH | `api/admin/contacts/{id}/read` | `System\ContactMessageController@markAsRead` | api, auth:api, verified, permission:manage contacts |
| 17 | PATCH | `api/admin/contacts/{id}/resolve` | `System\ContactMessageController@markAsResolved` | api, auth:api, verified, permission:manage contacts |
| 18 | GET | `api/admin/countries` | `Catalog\AdminCountryController@index` | api, auth:api, verified, permission:manage countries |
| 19 | POST | `api/admin/countries` | `Catalog\AdminCountryController@store` | api, auth:api, verified, permission:manage countries |
| 20 | PUT | `api/admin/countries/{id}` | `Catalog\AdminCountryController@update` | api, auth:api, verified, permission:manage countries |
| 21 | DELETE | `api/admin/countries/{id}` | `Catalog\AdminCountryController@destroy` | api, auth:api, verified, permission:manage countries |
| 22 | PATCH | `api/admin/countries/{id}/restore` | `Catalog\AdminCountryController@restore` | api, auth:api, verified, permission:manage countries |
| 23 | GET | `api/admin/destinations` | `Catalog\AdminDestinationController@index` | api, auth:api, verified, permission:manage destinations |
| 24 | POST | `api/admin/destinations` | `Catalog\AdminDestinationController@store` | api, auth:api, verified, permission:manage destinations |
| 25 | PUT | `api/admin/destinations/{id}` | `Catalog\AdminDestinationController@update` | api, auth:api, verified, permission:manage destinations |
| 26 | DELETE | `api/admin/destinations/{id}` | `Catalog\AdminDestinationController@destroy` | api, auth:api, verified, permission:manage destinations |
| 27 | PATCH | `api/admin/destinations/{id}/restore` | `Catalog\AdminDestinationController@restore` | api, auth:api, verified, permission:manage destinations |
| 28 | GET | `api/admin/flags` | `System\AdminFlagController@index` | api, auth:api, verified, role:admin\|super_admin |
| 29 | POST | `api/admin/flags/{id}/approve` | `System\AdminFlagController@approve` | api, auth:api, verified, role:admin\|super_admin |
| 30 | POST | `api/admin/flags/{id}/decline` | `System\AdminFlagController@decline` | api, auth:api, verified, role:admin\|super_admin |
| 31 | GET | `api/admin/flights` | `Catalog\AdminFlightController@index` | api, auth:api, verified, permission:manage flights |
| 32 | POST | `api/admin/flights` | `Catalog\AdminFlightController@store` | api, auth:api, verified, permission:manage flights |
| 33 | PUT | `api/admin/flights/{id}` | `Catalog\AdminFlightController@update` | api, auth:api, verified, permission:manage flights |
| 34 | DELETE | `api/admin/flights/{id}` | `Catalog\AdminFlightController@destroy` | api, auth:api, verified, permission:manage flights |
| 35 | PATCH | `api/admin/flights/{id}/restore` | `Catalog\AdminFlightController@restore` | api, auth:api, verified, permission:manage flights |
| 36 | GET | `api/admin/hotels` | `Catalog\AdminHotelController@index` | api, auth:api, verified, permission:manage hotels |
| 37 | POST | `api/admin/hotels` | `Catalog\AdminHotelController@store` | api, auth:api, verified, permission:manage hotels |
| 38 | PUT | `api/admin/hotels/{id}` | `Catalog\AdminHotelController@update` | api, auth:api, verified, permission:manage hotels |
| 39 | DELETE | `api/admin/hotels/{id}` | `Catalog\AdminHotelController@destroy` | api, auth:api, verified, permission:manage hotels |
| 40 | PATCH | `api/admin/hotels/{id}/restore` | `Catalog\AdminHotelController@restore` | api, auth:api, verified, permission:manage hotels |
| 41 | GET | `api/admin/notifications` | `System\AdminNotificationController@index` | api, auth:api, verified, role:admin\|super_admin |
| 42 | GET | `api/admin/reports` | `System\ReportController@index` | api, auth:api, verified, role:admin\|super_admin |
| 43 | POST | `api/admin/reports/generate` | `System\ReportController@generate` | api, auth:api, verified, role:admin\|super_admin |
| 44 | GET | `api/admin/reports/{id}/download` | `System\ReportController@download` | api, auth:api, verified, role:admin\|super_admin |
| 45 | GET | `api/admin/restaurants` | `Catalog\AdminRestaurantController@index` | api, auth:api, verified, permission:manage restaurants |
| 46 | POST | `api/admin/restaurants` | `Catalog\AdminRestaurantController@store` | api, auth:api, verified, permission:manage restaurants |
| 47 | PUT | `api/admin/restaurants/{id}` | `Catalog\AdminRestaurantController@update` | api, auth:api, verified, permission:manage restaurants |
| 48 | DELETE | `api/admin/restaurants/{id}` | `Catalog\AdminRestaurantController@destroy` | api, auth:api, verified, permission:manage restaurants |
| 49 | PATCH | `api/admin/restaurants/{id}/restore` | `Catalog\AdminRestaurantController@restore` | api, auth:api, verified, permission:manage restaurants |
| 50 | GET | `api/admin/reviews` | `Trips\AdminReviewController@index` | api, auth:api, verified, permission:manage reviews |
| 51 | DELETE | `api/admin/reviews/{id}` | `Trips\AdminReviewController@destroy` | api, auth:api, verified, permission:manage reviews |
| 52 | PATCH | `api/admin/reviews/{id}/approve` | `Trips\AdminReviewController@approve` | api, auth:api, verified, permission:manage reviews |
| 53 | PATCH | `api/admin/reviews/{id}/reject` | `Trips\AdminReviewController@reject` | api, auth:api, verified, permission:manage reviews |
| 54 | PATCH | `api/admin/reviews/{id}/restore` | `Trips\AdminReviewController@restore` | api, auth:api, verified, permission:manage reviews |
| 55 | POST | `api/admin/set-plans` | `Commerce\PlanController@setPlans` | api, auth:api, verified, permission:manage plans |
| 56 | GET | `api/admin/settings` | `System\SettingController@index` | api, auth:api, verified, permission:manage settings |
| 57 | PUT | `api/admin/settings` | `System\SettingController@update` | api, auth:api, verified, permission:manage settings |
| 58 | PATCH | `api/admin/settings/{key}` | `System\SettingController@patchKey` | api, auth:api, verified, permission:manage settings |
| 59 | GET | `api/admin/trips` | `Trips\AdminTripController@index` | api, auth:api, verified, permission:manage trips |
| 60 | POST | `api/admin/trips` | `Trips\AdminTripController@store` | api, auth:api, verified, permission:manage trips |
| 61 | PUT | `api/admin/trips/{id}` | `Trips\AdminTripController@update` | api, auth:api, verified, permission:manage trips |
| 62 | DELETE | `api/admin/trips/{id}` | `Trips\AdminTripController@destroy` | api, auth:api, verified, permission:manage trips |
| 63 | PATCH | `api/admin/trips/{id}/restore` | `Trips\AdminTripController@restore` | api, auth:api, verified, permission:manage trips |
| 64 | GET | `api/admin/users` | `Account\AdminUserController@index` | api, auth:api, verified, permission:manage users |
| 65 | POST | `api/admin/users` | `Account\AdminUserController@store` | api, auth:api, verified, permission:manage users |
| 66 | GET | `api/admin/users/{user}` | `Account\AdminUserController@show` | api, auth:api, verified, permission:manage users |
| 67 | PUT | `api/admin/users/{user}` | `Account\AdminUserController@update` | api, auth:api, verified, permission:manage users |
| 68 | PATCH | `api/admin/users/{user}/active` | `Account\AdminUserController@active` | api, auth:api, verified, permission:manage users |
| 69 | PATCH | `api/admin/users/{user}/block` | `Account\AdminUserController@block` | api, auth:api, verified, permission:manage users |
| 70 | GET | `api/agency-assignments` | `Commerce\AgencyAssignmentController@myAssignments` | api, auth:api |
| 71 | POST | `api/agency-assignments/{assignment}/cancel` | `Commerce\AgencyAssignmentController@cancel` | api, auth:api |
| 72 | POST | `api/agency-assignments/{assignment}/report` | `System\FlagController@store` | api, auth:api |
| 73 | POST | `api/agency-requests` | `Commerce\AgencyRequestController@store` | api, auth:api |
| 74 | GET | `api/agency/assignments` | `Commerce\AgencyAssignmentController@index` | api, auth:api, role:agency\|admin\|super_admin |
| 75 | POST | `api/agency/assignments/{assignment}/approve` | `Commerce\AgencyAssignmentController@approve` | api, auth:api, role:agency\|admin\|super_admin |
| 76 | POST | `api/agency/assignments/{assignment}/decline` | `Commerce\AgencyAssignmentController@decline` | api, auth:api, role:agency\|admin\|super_admin |
| 77 | POST | `api/agency/assignments/{assignment}/trips` | `Commerce\AgencyAssignmentController@createTrip` | api, auth:api, role:agency\|admin\|super_admin |
| 78 | GET | `api/agency/earnings` | `Commerce\AgencyAssignmentController@earnings` | api, auth:api, role:agency\|admin\|super_admin |
| 79 | GET | `api/agency/profile` | `Commerce\AgencyAssignmentController@getProfile` | api, auth:api, role:agency\|admin\|super_admin |
| 80 | PUT | `api/agency/profile` | `Commerce\AgencyAssignmentController@updateProfile` | api, auth:api, role:agency\|admin\|super_admin |
| 81 | GET | `api/agency/trips` | `Commerce\AgencyAssignmentController@trips` | api, auth:api, role:agency\|admin\|super_admin |
| 82 | POST | `api/ai/plan` | `Trips\AIController@generate` | api, throttle:ai |
| 83 | GET | `api/ai/quota` | `System\DashboardController@aiQuota` | api, auth:api, verified |
| 84 | GET | `api/ai/review/{id}` | `Trips\AIController@review` | api, auth:api, verified, throttle:ai |
| 85 | POST | `api/ai/review/{id}` | `Trips\AIController@review` | api, auth:api, verified, throttle:ai |
| 86 | GET | `api/attractions` | `Catalog\AttractionController@index` | api |
| 87 | GET | `api/attractions/{id}` | `Catalog\AttractionController@show` | api |
| 88 | GET | `api/auth/facebook` | `Account\AuthController@facebookRedirect` | api |
| 89 | GET | `api/auth/facebook/callback` | `Account\AuthController@facebookCallback` | api |
| 90 | GET | `api/auth/google` | `Account\AuthController@googleRegister` | api |
| 91 | GET | `api/auth/google/callback` | `Account\AuthController@googleCallback` | api |
| 92 | POST | `api/auth/social/complete` | `Account\AuthController@completeSocialRegistration` | api, auth:api |
| 93 | GET | `api/categories` | `Catalog\CategoryController@index` | api |
| 94 | GET | `api/categories/{category}` | `Catalog\CategoryController@show` | api |
| 95 | POST | `api/checkout/initiate` | `Commerce\CheckoutController@initiate` | api, auth:api, verified, throttle:checkout |
| 96 | GET | `api/cities` | `Catalog\CountryController@cities` | api |
| 97 | POST | `api/contacts` | `System\ContactController@store` | api, throttle:contacts |
| 98 | GET | `api/conversations` | `Chat\ConversationController@index` | api, auth:api, verified |
| 99 | POST | `api/conversations` | `Chat\ConversationController@store` | api, auth:api, verified |
| 100 | GET | `api/conversations/{conversation}` | `Chat\ConversationController@show` | api, auth:api, verified |
| 101 | GET | `api/conversations/{conversation}/messages` | `Chat\ConversationController@messages` | api, auth:api, verified |
| 102 | POST | `api/conversations/{conversation}/messages` | `Chat\ConversationController@sendMessage` | api, auth:api, verified |
| 103 | PATCH | `api/conversations/{conversation}/read` | `Chat\ConversationController@markAsRead` | api, auth:api, verified |
| 104 | GET | `api/countries` | `Catalog\CountryController@index` | api |
| 105 | GET | `api/countries/{id}` | `Catalog\CountryController@show` | api |
| 106 | GET | `api/dashboard` | `System\DashboardController@index` | api, auth:api, verified |
| 107 | GET | `api/dashboard/favourites` | `System\DashboardController@favourites` | api, auth:api, verified |
| 108 | GET | `api/dashboard/orders` | `System\DashboardController@orders` | api, auth:api, verified |
| 109 | GET | `api/dashboard/trips` | `System\DashboardController@trips` | api, auth:api, verified |
| 110 | GET | `api/destinations` | `Catalog\DestinationController@index` | api |
| 111 | POST | `api/destinations/{destination}/book` | `Catalog\DestinationController@book` | api, auth:api |
| 112 | GET | `api/destinations/{destination}/hotels` | `Catalog\HotelController@byDestination` | api |
| 113 | GET | `api/destinations/{id}` | `Catalog\DestinationController@show` | api |
| 114 | POST | `api/email/resend` | `Account\AuthController@resendVerificationEmail` | api, auth:api, throttle:6,1 |
| 115 | GET | `api/email/verify-notice` | `Account\AuthController@verificationNotice` | api, auth:api |
| 116 | GET | `api/email/verify/{id}/{hash}` | `Account\AuthController@verifyEmail` | api, signed |
| 117 | POST | `api/enhance` | `Trips\AIController@enhance` | api, auth:api, verified, throttle:ai |
| 118 | POST | `api/favourites/{type}/{id}` | `Trips\InteractionController@toggleFavourite` | api, auth:api, verified |
| 119 | GET | `api/flights` | `Catalog\FlightController@index` | api |
| 120 | GET | `api/flights/{id}` | `Catalog\FlightController@show` | api |
| 121 | POST | `api/forgot-password` | `Account\AuthController@forgetPassword` | api, throttle:3,10 |
| 122 | GET | `api/hotels` | `Catalog\HotelController@index` | api |
| 123 | GET | `api/hotels/{hotel}/reviews` | `Catalog\HotelController@reviews` | api |
| 124 | GET | `api/hotels/{id}` | `Catalog\HotelController@show` | api |
| 125 | POST | `api/login` | `Account\AuthController@login` | api, throttle:login |
| 126 | POST | `api/logout` | `Account\AuthController@logout` | api, auth:api |
| 127 | GET | `api/maps/destination/{destination}` | `Trips\MapController@destination` | api, throttle:maps |
| 128 | GET | `api/maps/trip/{trip}` | `Trips\MapController@trip` | api, auth:api, verified |
| 129 | GET | `api/me` | `Account\AuthController@me` | api, auth:api |
| 130 | GET | `api/me/ai-quota` | `System\DashboardController@aiQuota` | api, auth:api, verified |
| 131 | GET | `api/me/orders` | `System\DashboardController@orders` | api, auth:api, verified |
| 132 | GET | `api/me/reports` | `System\ReportController@myReports` | api, auth:api, verified |
| 133 | GET | `api/me/reviews` | `Trips\InteractionController@myReviews` | api, auth:api, verified |
| 134 | POST | `api/me/subscribe` | `Commerce\PlanController@subscribe` | api, auth:api, verified, permission:subscribe to plans |
| 135 | GET | `api/me/subscription` | `Commerce\PlanController@subscription` | api, auth:api, verified, permission:view my subscription |
| 136 | POST | `api/me/subscription/cancel` | `Commerce\PlanController@cancel` | api, auth:api, verified, permission:cancel subscription |
| 137 | POST | `api/me/upgrade` | `Commerce\PlanController@upgrade` | api, auth:api, verified, permission:upgrade plans |
| 138 | POST | `api/newsletter/subscribe` | `System\NewsletterController@store` | api, throttle:newsletter |
| 139 | GET | `api/notifications` | `System\NotificationController@index` | api, auth:api, verified |
| 140 | PATCH | `api/notifications/read-all` | `System\NotificationController@markAllAsRead` | api, auth:api, verified |
| 141 | PATCH | `api/notifications/{notification}/read` | `System\NotificationController@markAsRead` | api, auth:api, verified |
| 142 | GET | `api/orders` | `System\DashboardController@orders` | api, auth:api, verified |
| 143 | GET | `api/orders/lookup/{orderRef}` | `System\DashboardController@lookupOrder` | api, auth:api, verified |
| 144 | GET | `api/paymob/callback` | `Commerce\PaymobWebhookController@callback` | web |
| 145 | POST | `api/paymob/webhook` | `Commerce\PaymobWebhookController@handle` | api |
| 146 | GET | `api/plans` | `Commerce\PlanController@index` | api |
| 147 | GET | `api/plans/{id}` | `Commerce\PlanController@show` | api |
| 148 | PATCH|POST | `api/profile` | `Account\AuthController@updateProfile` | api, auth:api |
| 149 | POST | `api/refresh` | `Account\AuthController@refresh` | api, auth:api, throttle:15,1 |
| 150 | GET | `api/regions` | `Catalog\RegionController@index` | api |
| 151 | POST | `api/register` | `Account\AuthController@register` | api, throttle:register |
| 152 | POST | `api/reset-password` | `Account\AuthController@resetPassword` | api, throttle:5,1 |
| 153 | GET | `api/restaurants` | `Catalog\RestaurantController@index` | api |
| 154 | GET | `api/restaurants/{id}` | `Catalog\RestaurantController@show` | api |
| 155 | POST | `api/review` | `Trips\AIController@generate` | api, auth:api, verified, permission:generate ai itineraries, throttle:ai |
| 156 | GET | `api/review/{id}` | `Trips\AIController@review` | api, auth:api, verified, throttle:ai |
| 157 | POST | `api/review/{id}` | `Trips\AIController@review` | api, auth:api, verified, throttle:ai |
| 158 | GET | `api/reviews/my` | `Trips\InteractionController@myReviews` | api, auth:api, verified |
| 159 | DELETE | `api/reviews/{id}` | `Trips\InteractionController@destroyReview` | api, auth:api, verified |
| 160 | GET | `api/reviews/{type}/{id}` | `Trips\InteractionController@getEntityReviews` | api |
| 161 | POST | `api/reviews/{type}/{id}` | `Trips\InteractionController@storeReview` | api, auth:api, verified |
| 162 | GET | `api/site-settings` | `System\SiteSettingsController@index` | api |
| 163 | GET | `api/stats/summary` | `Catalog\StatsController@summary` | api |
| 164 | GET | `api/surveys` | `System\SurveyController@index` | api, auth:api, verified |
| 165 | POST | `api/surveys` | `System\SurveyController@store` | api, auth:api, verified |
| 166 | GET | `api/surveys/{survey}` | `System\SurveyController@show` | api, auth:api, verified |
| 167 | PUT|PATCH | `api/surveys/{survey}` | `System\SurveyController@update` | api, auth:api, verified |
| 168 | DELETE | `api/surveys/{survey}` | `System\SurveyController@destroy` | api, auth:api, verified |
| 169 | GET | `api/trips` | `Trips\TripController@index` | api, auth:api, verified |
| 170 | POST | `api/trips` | `Trips\TripController@store` | api, auth:api, verified |
| 171 | POST | `api/trips/ai-generate` | `Trips\AIController@generate` | api, throttle:ai |
| 172 | GET | `api/trips/create` | `Trips\TripController@creationData` | api, auth:api, verified |
| 173 | POST | `api/trips/generate-ai` | `Trips\AIController@generate` | api, throttle:ai |
| 174 | GET | `api/trips/{trip}` | `Trips\TripController@show` | api, auth:api, verified |
| 175 | PUT|PATCH | `api/trips/{trip}` | `Trips\TripController@update` | api, auth:api, verified |
| 176 | DELETE | `api/trips/{trip}` | `Trips\TripController@destroy` | api, auth:api, verified |
| 177 | POST | `api/trips/{trip}/attach/{type}` | `Trips\TripController@attach` | api, auth:api, verified |
| 178 | POST | `api/trips/{trip}/concierge` | `ConciergeController@ask` | api, auth:api, verified, throttle:ai |
| 179 | DELETE | `api/trips/{trip}/detach/{id}` | `Trips\TripController@detach` | api, auth:api, verified |
| 180 | POST | `api/trips/{trip}/fork` | `Trips\TripController@fork` | api, auth:api, verified |
| 181 | PUT | `api/trips/{trip}/items/{id}` | `Trips\TripController@updateItem` | api, auth:api, verified |
| 182 | GET | `api/user` | `Account\AuthController@me` | api, auth:api |
| 183 | GET | `api/v1/ai/review/{id}` | `Trips\AIController@review` | api, auth:api, verified |
| 184 | POST | `api/v1/ai/review/{id}` | `Trips\AIController@review` | api, auth:api, verified |
| 185 | GET | `api/v1/attractions` | `Catalog\AttractionController@index` | api |
| 186 | GET | `api/v1/attractions/{id}` | `Catalog\AttractionController@show` | api |
| 187 | GET | `api/v1/cities` | `Catalog\CountryController@cities` | api |
| 188 | GET | `api/v1/countries` | `Catalog\CountryController@index` | api |
| 189 | GET | `api/v1/countries/{id}` | `Catalog\CountryController@show` | api |
| 190 | GET | `api/v1/destinations` | `Catalog\DestinationController@index` | api |
| 191 | POST | `api/v1/destinations/{destination}/book` | `Catalog\DestinationController@book` | api, auth:api |
| 192 | GET | `api/v1/destinations/{destination}/hotels` | `Catalog\HotelController@byDestination` | api |
| 193 | GET | `api/v1/destinations/{id}` | `Catalog\DestinationController@show` | api |
| 194 | GET | `api/v1/flights` | `Catalog\FlightController@index` | api |
| 195 | GET | `api/v1/flights/{id}` | `Catalog\FlightController@show` | api |
| 196 | GET | `api/v1/hotels` | `Catalog\HotelController@index` | api |
| 197 | GET | `api/v1/hotels/{hotel}/reviews` | `Catalog\HotelController@reviews` | api |
| 198 | GET | `api/v1/hotels/{id}` | `Catalog\HotelController@show` | api |
| 199 | GET | `api/v1/paymob/callback` | `Commerce\PaymobWebhookController@callback` | web |
| 200 | POST | `api/v1/paymob/webhook` | `Commerce\PaymobWebhookController@handle` | api |
| 201 | GET | `api/v1/regions` | `Catalog\RegionController@index` | api |
| 202 | GET | `api/v1/restaurants` | `Catalog\RestaurantController@index` | api |
| 203 | GET | `api/v1/restaurants/{id}` | `Catalog\RestaurantController@show` | api |
| 204 | GET | `api/v1/review/{id}` | `Trips\AIController@review` | api, auth:api, verified |
| 205 | POST | `api/v1/review/{id}` | `Trips\AIController@review` | api, auth:api, verified |
| 206 | GET | `api/v1/stats/summary` | `Catalog\StatsController@summary` | api |
| 207 | GET | `api/v1/trips` | `Trips\TripController@index` | api, auth:api, verified |
| 208 | POST | `api/v1/trips` | `Trips\TripController@store` | api, auth:api, verified |
| 209 | GET | `api/v1/trips/{trip}` | `Trips\TripController@show` | api, auth:api, verified |
| 210 | PUT | `api/v1/trips/{trip}` | `Trips\TripController@update` | api, auth:api, verified |
| 211 | DELETE | `api/v1/trips/{trip}` | `Trips\TripController@destroy` | api, auth:api, verified |
| 212 | GET | `api/v1/weather` | `System\WeatherController@show` | api, throttle:weather |
| 213 | GET | `api/weather` | `System\WeatherController@show` | api, throttle:weather |

**Counts:** `api/*` 213 · total 222 (incl. `docs/api`, `storage/{path}`, `up`, `web /`). Audited via `rg -c "Route::" routes/api.php` gave 237 registrations before expansion; `route:list` expands `apiResource` etc. to 213 deployed.