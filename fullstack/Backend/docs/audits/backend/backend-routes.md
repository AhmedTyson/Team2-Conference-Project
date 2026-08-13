# Backend Routes Inventory

- Source: php artisan route:list --json (route registry, authoritative).
- Registry total: 145 route objects (methods incl. GET|HEAD + PUT|PATCH combos; distinct URIs fewer).

## Account — 17 routes

| Method | URI | Name | Middleware | Action |
| ------ | --- | ---- | ---------- | ------ |
| POST | api/email/resend | verification.resend | api, auth:api, throttle:6,1 | App\Http\Controllers\Account\AuthController@resendVerificationEmail |
| GET|HEAD | api/email/verify-notice | verification.notice | api, auth:api | App\Http\Controllers\Account\AuthController@verificationNotice |
| GET|HEAD | api/email/verify/{id}/{hash} | verification.verify | api, signed | App\Http\Controllers\Account\AuthController@verifyEmail |
| POST | api/forgot-password | - | api, throttle:3,10 | App\Http\Controllers\Account\AuthController@forgetPassword |
| POST | api/login | login | api, throttle:login | App\Http\Controllers\Account\AuthController@login |
| POST | api/logout | - | api, auth:api | App\Http\Controllers\Account\AuthController@logout |
| POST | api/refresh | - | api, auth:api, throttle:15,1 | App\Http\Controllers\Account\AuthController@refresh |
| POST | api/register | - | api, throttle:register | App\Http\Controllers\Account\AuthController@register |
| POST | api/reset-password | password.reset | api, throttle:5,1 | App\Http\Controllers\Account\AuthController@resetPassword |
| GET|HEAD | api/user | - | api, auth:api | App\Http\Controllers\Account\AuthController@me |
| GET|HEAD | api/v1/admin/users | admin. | api, auth:api, permission:manage users | App\Http\Controllers\Account\AdminUserController@index |
| POST | api/v1/admin/users | admin. | api, auth:api, permission:manage users | App\Http\Controllers\Account\AdminUserController@store |
| GET|HEAD | api/v1/admin/users/{user} | admin. | api, auth:api, permission:manage users | App\Http\Controllers\Account\AdminUserController@show |
| PUT | api/v1/admin/users/{user} | admin. | api, auth:api, permission:manage users | App\Http\Controllers\Account\AdminUserController@update |
| PATCH | api/v1/admin/users/{user}/active | admin. | api, auth:api, permission:manage users | App\Http\Controllers\Account\AdminUserController@active |
| PATCH | api/v1/admin/users/{user}/block | admin. | api, auth:api, permission:manage users | App\Http\Controllers\Account\AdminUserController@block |
| PATCH | api/v1/profile | - | api, auth:api | App\Http\Controllers\Account\AuthController@updateProfile |

## Catalog — 47 routes

| Method | URI | Name | Middleware | Action |
| ------ | --- | ---- | ---------- | ------ |
| GET|HEAD | api/v1/admin/attractions | admin. | api, auth:api, permission:manage attractions | App\Http\Controllers\Catalog\AdminAttractionController@index |
| POST | api/v1/admin/attractions | admin. | api, auth:api, permission:manage attractions | App\Http\Controllers\Catalog\AdminAttractionController@store |
| PUT | api/v1/admin/attractions/{id} | admin. | api, auth:api, permission:manage attractions | App\Http\Controllers\Catalog\AdminAttractionController@update |
| DELETE | api/v1/admin/attractions/{id} | admin. | api, auth:api, permission:manage attractions | App\Http\Controllers\Catalog\AdminAttractionController@destroy |
| PATCH | api/v1/admin/attractions/{id}/restore | admin. | api, auth:api, permission:manage attractions | App\Http\Controllers\Catalog\AdminAttractionController@restore |
| GET|HEAD | api/v1/admin/categories | admin.categories.index | api, auth:api, permission:manage categories | App\Http\Controllers\Catalog\AdminCategoryController@index |
| POST | api/v1/admin/categories | admin.categories.store | api, auth:api, permission:manage categories | App\Http\Controllers\Catalog\AdminCategoryController@store |
| PUT | api/v1/admin/categories/{category} | admin.categories.update | api, auth:api, permission:manage categories | App\Http\Controllers\Catalog\AdminCategoryController@update |
| DELETE | api/v1/admin/categories/{category} | admin.categories.destroy | api, auth:api, permission:manage categories | App\Http\Controllers\Catalog\AdminCategoryController@destroy |
| PATCH | api/v1/admin/categories/{id}/restore | admin.categories.restore | api, auth:api, permission:manage categories | App\Http\Controllers\Catalog\AdminCategoryController@restore |
| GET|HEAD | api/v1/admin/countries | admin. | api, auth:api, permission:manage countries | App\Http\Controllers\Catalog\AdminCountryController@index |
| POST | api/v1/admin/countries | admin. | api, auth:api, permission:manage countries | App\Http\Controllers\Catalog\AdminCountryController@store |
| PUT | api/v1/admin/countries/{id} | admin. | api, auth:api, permission:manage countries | App\Http\Controllers\Catalog\AdminCountryController@update |
| DELETE | api/v1/admin/countries/{id} | admin. | api, auth:api, permission:manage countries | App\Http\Controllers\Catalog\AdminCountryController@destroy |
| PATCH | api/v1/admin/countries/{id}/restore | admin. | api, auth:api, permission:manage countries | App\Http\Controllers\Catalog\AdminCountryController@restore |
| GET|HEAD | api/v1/admin/destinations | admin.destinations.index | api, auth:api, permission:manage destinations | App\Http\Controllers\Catalog\AdminDestinationController@index |
| POST | api/v1/admin/destinations | admin.destinations.store | api, auth:api, permission:manage destinations | App\Http\Controllers\Catalog\AdminDestinationController@store |
| PUT | api/v1/admin/destinations/{id} | admin.destinations.update | api, auth:api, permission:manage destinations | App\Http\Controllers\Catalog\AdminDestinationController@update |
| DELETE | api/v1/admin/destinations/{id} | admin.destinations.destroy | api, auth:api, permission:manage destinations | App\Http\Controllers\Catalog\AdminDestinationController@destroy |
| PATCH | api/v1/admin/destinations/{id}/restore | admin.destinations.restore | api, auth:api, permission:manage destinations | App\Http\Controllers\Catalog\AdminDestinationController@restore |
| GET|HEAD | api/v1/admin/flights | admin. | api, auth:api, permission:manage flights | App\Http\Controllers\Catalog\AdminFlightController@index |
| POST | api/v1/admin/flights | admin. | api, auth:api, permission:manage flights | App\Http\Controllers\Catalog\AdminFlightController@store |
| PUT | api/v1/admin/flights/{id} | admin. | api, auth:api, permission:manage flights | App\Http\Controllers\Catalog\AdminFlightController@update |
| DELETE | api/v1/admin/flights/{id} | admin. | api, auth:api, permission:manage flights | App\Http\Controllers\Catalog\AdminFlightController@destroy |
| PATCH | api/v1/admin/flights/{id}/restore | admin. | api, auth:api, permission:manage flights | App\Http\Controllers\Catalog\AdminFlightController@restore |
| GET|HEAD | api/v1/admin/hotels | admin. | api, auth:api, permission:manage hotels | App\Http\Controllers\Catalog\AdminHotelController@index |
| POST | api/v1/admin/hotels | admin. | api, auth:api, permission:manage hotels | App\Http\Controllers\Catalog\AdminHotelController@store |
| PUT | api/v1/admin/hotels/{id} | admin. | api, auth:api, permission:manage hotels | App\Http\Controllers\Catalog\AdminHotelController@update |
| DELETE | api/v1/admin/hotels/{id} | admin. | api, auth:api, permission:manage hotels | App\Http\Controllers\Catalog\AdminHotelController@destroy |
| PATCH | api/v1/admin/hotels/{id}/restore | admin. | api, auth:api, permission:manage hotels | App\Http\Controllers\Catalog\AdminHotelController@restore |
| GET|HEAD | api/v1/admin/restaurants | admin. | api, auth:api, permission:manage restaurants | App\Http\Controllers\Catalog\AdminRestaurantController@index |
| POST | api/v1/admin/restaurants | admin. | api, auth:api, permission:manage restaurants | App\Http\Controllers\Catalog\AdminRestaurantController@store |
| PUT | api/v1/admin/restaurants/{id} | admin. | api, auth:api, permission:manage restaurants | App\Http\Controllers\Catalog\AdminRestaurantController@update |
| DELETE | api/v1/admin/restaurants/{id} | admin. | api, auth:api, permission:manage restaurants | App\Http\Controllers\Catalog\AdminRestaurantController@destroy |
| PATCH | api/v1/admin/restaurants/{id}/restore | admin. | api, auth:api, permission:manage restaurants | App\Http\Controllers\Catalog\AdminRestaurantController@restore |
| GET|HEAD | api/v1/attractions | - | api | App\Http\Controllers\Catalog\AttractionController@index |
| GET|HEAD | api/v1/attractions/{id} | - | api | App\Http\Controllers\Catalog\AttractionController@show |
| GET|HEAD | api/v1/categories | categories.index | api | App\Http\Controllers\Catalog\CategoryController@index |
| GET|HEAD | api/v1/categories/{category} | categories.show | api | App\Http\Controllers\Catalog\CategoryController@show |
| GET|HEAD | api/v1/destinations | - | api | App\Http\Controllers\Catalog\DestinationController@index |
| GET|HEAD | api/v1/destinations/{id} | - | api | App\Http\Controllers\Catalog\DestinationController@show |
| GET|HEAD | api/v1/flights | - | api | App\Http\Controllers\Catalog\FlightController@index |
| GET|HEAD | api/v1/flights/{id} | - | api | App\Http\Controllers\Catalog\FlightController@show |
| GET|HEAD | api/v1/hotels | - | api | App\Http\Controllers\Catalog\HotelController@index |
| GET|HEAD | api/v1/hotels/{id} | - | api | App\Http\Controllers\Catalog\HotelController@show |
| GET|HEAD | api/v1/restaurants | - | api | App\Http\Controllers\Catalog\RestaurantController@index |
| GET|HEAD | api/v1/restaurants/{id} | - | api | App\Http\Controllers\Catalog\RestaurantController@show |

## Commerce — 18 routes

| Method | URI | Name | Middleware | Action |
| ------ | --- | ---- | ---------- | ------ |
| GET|HEAD | api/v1/admin/agency-requests | agency-requests.index | api, auth:api, role:admin|super_admin | App\Http\Controllers\Commerce\AdminAgencyController@adminIndex |
| POST | api/v1/admin/agency-requests/{assignment}/approve | - | api, auth:api, role:admin|super_admin | App\Http\Controllers\Commerce\AdminAgencyController@approve |
| GET|HEAD | api/v1/admin/analytics | admin.analytics.index | api, auth:api, permission:view analytics | App\Http\Controllers\Commerce\AdminAnalyticsController@index |
| GET|HEAD | api/v1/admin/analytics/revenue | admin.analytics.revenue | api, auth:api, permission:view analytics | App\Http\Controllers\Commerce\AdminAnalyticsController@revenue |
| POST | api/v1/admin/set-plans | plans. | api, auth:api, permission:manage plans | App\Http\Controllers\Commerce\PlanController@setPlans |
| GET|HEAD | api/v1/agency-assignments | - | api, auth:api | App\Http\Controllers\Commerce\AgencyAssignmentController@myAssignments |
| POST | api/v1/agency-assignments/{assignment}/cancel | - | api, auth:api | App\Http\Controllers\Commerce\AgencyAssignmentController@cancel |
| POST | api/v1/agency-assignments/{assignment}/report | - | api, auth:api | App\Http\Controllers\System\FlagController@store |
| POST | api/v1/agency-requests | - | api, auth:api | App\Http\Controllers\Commerce\AgencyRequestController@store |
| GET|HEAD | api/v1/agency/assignments | - | api, auth:api, role:agency | App\Http\Controllers\Commerce\AgencyAssignmentController@index |
| POST | api/v1/agency/assignments/{assignment}/approve | - | api, auth:api, role:agency | App\Http\Controllers\Commerce\AgencyAssignmentController@approve |
| POST | api/v1/agency/assignments/{assignment}/decline | - | api, auth:api, role:agency | App\Http\Controllers\Commerce\AgencyAssignmentController@decline |
| POST | api/v1/checkout/initiate | checkout.initiate | api, auth:api, throttle:checkout | App\Http\Controllers\Commerce\CheckoutController@initiate |
| GET|HEAD | api/v1/me/subscription | plans. | api, auth:api, permission:view my subscription | App\Http\Controllers\Commerce\PlanController@subscription |
| POST | api/v1/me/subscription/cancel | plans. | api, auth:api, permission:cancel subscription | App\Http\Controllers\Commerce\PlanController@cancel |
| GET|HEAD | api/v1/paymob/callback | paymob-v1.callback | api | App\Http\Controllers\Commerce\PaymobWebhookController@callback |
| POST | api/v1/paymob/webhook | paymob-v1.webhook | api | App\Http\Controllers\Commerce\PaymobWebhookController@handle |
| GET|HEAD | api/v1/plans | plans. | api, auth:api, permission:get plans | App\Http\Controllers\Commerce\PlanController@index |

## Other — 5 routes

| Method | URI | Name | Middleware | Action |
| ------ | --- | ---- | ---------- | ------ |
| POST | api/enhance | - | api, auth:api, throttle:ai | App\Http\Controllers\Trips\AIController@enhance |
| GET|HEAD | api/review/{id} | - | api, auth:api, throttle:ai | App\Http\Controllers\Trips\AIController@review |
| POST | api/v1/me/subscribe | plans. | api, auth:api, permission:subscribe to plans | App\Http\Controllers\Commerce\PlanController@subscribe |
| POST | api/v1/me/upgrade | plans. | api, auth:api, permission:upgrade plans | App\Http\Controllers\Commerce\PlanController@upgrade |
| GET|HEAD | up | - | none | Closure |

## System — 26 routes

| Method | URI | Name | Middleware | Action |
| ------ | --- | ---- | ---------- | ------ |
| GET|HEAD | api/me/reports | - | api, auth:api | App\Http\Controllers\System\ReportController@myReports |
| GET|HEAD | api/surveys | surveys.index | api, auth:api | App\Http\Controllers\System\SurveyController@index |
| POST | api/surveys | surveys.store | api, auth:api | App\Http\Controllers\System\SurveyController@store |
| GET|HEAD | api/surveys/{survey} | surveys.show | api, auth:api | App\Http\Controllers\System\SurveyController@show |
| PUT|PATCH | api/surveys/{survey} | surveys.update | api, auth:api | App\Http\Controllers\System\SurveyController@update |
| DELETE | api/surveys/{survey} | surveys.destroy | api, auth:api | App\Http\Controllers\System\SurveyController@destroy |
| GET|HEAD | api/v1/admin/contacts | admin.contacts.index | api, auth:api, permission:manage contacts | App\Http\Controllers\System\ContactMessageController@index |
| PATCH | api/v1/admin/contacts/{id}/read | admin.contacts.read | api, auth:api, permission:manage contacts | App\Http\Controllers\System\ContactMessageController@markAsRead |
| PATCH | api/v1/admin/contacts/{id}/resolve | admin.contacts.resolve | api, auth:api, permission:manage contacts | App\Http\Controllers\System\ContactMessageController@markAsResolved |
| GET|HEAD | api/v1/admin/flags | - | api, auth:api, role:admin|super_admin | App\Http\Controllers\System\AdminFlagController@index |
| POST | api/v1/admin/flags/{flag}/approve | - | api, auth:api, role:admin|super_admin | App\Http\Controllers\System\AdminFlagController@approve |
| POST | api/v1/admin/flags/{flag}/decline | - | api, auth:api, role:admin|super_admin | App\Http\Controllers\System\AdminFlagController@decline |
| GET|HEAD | api/v1/admin/notifications | admin.notifications. | api, auth:api, role:admin|super_admin | App\Http\Controllers\System\AdminNotificationController@index |
| GET|HEAD | api/v1/admin/reports | - | api, auth:api, role:admin|super_admin | App\Http\Controllers\System\ReportController@index |
| POST | api/v1/admin/reports/generate | - | api, auth:api, role:admin|super_admin | App\Http\Controllers\System\ReportController@generate |
| GET|HEAD | api/v1/admin/reports/{id}/download | - | api, auth:api, role:admin|super_admin | App\Http\Controllers\System\ReportController@download |
| GET|HEAD | api/v1/admin/settings | admin.settings.index | api, auth:api, permission:manage settings | App\Http\Controllers\System\SettingController@index |
| PUT | api/v1/admin/settings | admin.settings.update | api, auth:api, permission:manage settings | App\Http\Controllers\System\SettingController@update |
| PATCH | api/v1/admin/settings/{key} | admin.settings.patchKey | api, auth:api, permission:manage settings | App\Http\Controllers\System\SettingController@patchKey |
| POST | api/v1/contacts | - | api | App\Http\Controllers\System\ContactController@store |
| GET|HEAD | api/v1/dashboard | dashboard.index | api, auth:api | App\Http\Controllers\System\DashboardController@index |
| GET|HEAD | api/v1/notifications | notifications. | api, auth:api | App\Http\Controllers\System\NotificationController@index |
| PATCH | api/v1/notifications/read-all | notifications. | api, auth:api | App\Http\Controllers\System\NotificationController@markAllAsRead |
| PATCH | api/v1/notifications/{notification}/read | notifications. | api, auth:api | App\Http\Controllers\System\NotificationController@markAsRead |
| GET|HEAD | api/v1/site-settings | site-settings.index | api | App\Http\Controllers\System\SiteSettingsController@index |
| GET|HEAD | api/weather | - | api | App\Http\Controllers\System\WeatherController@show |

## Trips — 26 routes

| Method | URI | Name | Middleware | Action |
| ------ | --- | ---- | ---------- | ------ |
| POST | api/review | - | api, auth:api, permission:generate ai itineraries, throttle:ai | App\Services\GroqService@generateAi |
| GET|HEAD | api/v1/admin/reviews | admin. | api, auth:api, permission:manage reviews | App\Http\Controllers\Trips\AdminReviewController@index |
| DELETE | api/v1/admin/reviews/{id} | admin. | api, auth:api, permission:manage reviews | App\Http\Controllers\Trips\AdminReviewController@destroy |
| PATCH | api/v1/admin/reviews/{id}/approve | admin. | api, auth:api, permission:manage reviews | App\Http\Controllers\Trips\AdminReviewController@approve |
| PATCH | api/v1/admin/reviews/{id}/reject | admin. | api, auth:api, permission:manage reviews | App\Http\Controllers\Trips\AdminReviewController@reject |
| PATCH | api/v1/admin/reviews/{id}/restore | admin. | api, auth:api, permission:manage reviews | App\Http\Controllers\Trips\AdminReviewController@restore |
| GET|HEAD | api/v1/admin/trips | admin. | api, auth:api, permission:manage trips | App\Http\Controllers\Trips\AdminTripController@index |
| POST | api/v1/admin/trips | admin. | api, auth:api, permission:manage trips | App\Http\Controllers\Trips\AdminTripController@store |
| PUT | api/v1/admin/trips/{id} | admin. | api, auth:api, permission:manage trips | App\Http\Controllers\Trips\AdminTripController@update |
| DELETE | api/v1/admin/trips/{id} | admin. | api, auth:api, permission:manage trips | App\Http\Controllers\Trips\AdminTripController@destroy |
| PATCH | api/v1/admin/trips/{id}/restore | admin. | api, auth:api, permission:manage trips | App\Http\Controllers\Trips\AdminTripController@restore |
| POST | api/v1/agency/assignments/{assignment}/trips | - | api, auth:api, role:agency | App\Http\Controllers\Commerce\AgencyAssignmentController@createTrip |
| GET|HEAD | api/v1/dashboard/favourites | dashboard.favourites | api, auth:api | App\Http\Controllers\System\DashboardController@favourites |
| GET|HEAD | api/v1/dashboard/trips | dashboard.trips | api, auth:api | App\Http\Controllers\System\DashboardController@trips |
| POST | api/v1/favourites/{type}/{id} | - | api, auth:api | App\Http\Controllers\Trips\InteractionController@toggleFavourite |
| GET|HEAD | api/v1/maps/destination/{destination} | - | api, throttle:maps | App\Http\Controllers\Trips\MapController@destination |
| GET|HEAD | api/v1/maps/trip/{trip} | - | api, auth:api | App\Http\Controllers\Trips\MapController@trip |
| DELETE | api/v1/reviews/{id} | - | api, auth:api | App\Http\Controllers\Trips\InteractionController@destroyReview |
| POST | api/v1/reviews/{type}/{id} | - | api, auth:api | App\Http\Controllers\Trips\InteractionController@storeReview |
| POST | api/v1/trips | - | api, auth:api | App\Http\Controllers\Trips\TripController@store |
| GET|HEAD | api/v1/trips/create | - | api, auth:api | App\Http\Controllers\Trips\TripController@create |
| GET|HEAD | api/v1/trips/{trip} | - | api, auth:api | App\Http\Controllers\Trips\TripController@show |
| POST | api/v1/trips/{trip}/attach/{type} | - | api, auth:api | App\Http\Controllers\Trips\TripController@attach |
| POST | api/v1/trips/{trip}/concierge | - | api, auth:api, throttle:ai | App\Http\Controllers\ConciergeController@ask |
| DELETE | api/v1/trips/{trip}/detach/{id} | - | api, auth:api | App\Http\Controllers\Trips\TripController@detach |
| POST | api/v1/trips/{trip}/fork | - | api, auth:api | App\Http\Controllers\Trips\TripController@fork |

## Web — 6 routes

| Method | URI | Name | Middleware | Action |
| ------ | --- | ---- | ---------- | ------ |
| GET|HEAD | / | - | web | Closure |
| GET|HEAD | docs/api | scramble.docs.ui | web, Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess | Closure |
| GET|HEAD | docs/api.json | scramble.docs.document | web, Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess | Closure |
| GET|HEAD | mail-preview/{type} | - | web | Closure |
| GET|HEAD | storage/{path} | storage.local | none | Closure |
| PUT | storage/{path} | storage.local.upload | none | Closure |

