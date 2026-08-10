# System Prompt / Architectural Context for AI

If you are an AI assisting with this Laravel project, you MUST strictly adhere to the following N-Tier Architecture rules and utilize the file tree provided below for context.

## Architecture Overview (N-Tier)
This project uses a strict 4-layer architecture to decouple HTTP requests, business logic, and database access:
1. **Controllers (`app/Http/Controllers`)** -> Handles HTTP & Validation.
2. **Services (`app/Services`)** -> Handles Business Logic.
3. **Interfaces (`app/Interfaces`)** -> Contracts for data access.
4. **Repositories (`app/Repositories`)** -> Handles Database/Eloquent queries.

---

## 🛑 STRICT RULES FOR AI AGENTS

### 1. Controllers (Thin Layer)
- NEVER use Eloquent models directly in a controller (No `Model::create()`, `Model::find()`, `Model::where()`).
- Controllers MUST inject a `Service` class.
- Controllers are responsible ONLY for:
  1. Receiving the `Request` or `FormRequest` (Validation).
  2. Passing data/filters to the Service.
  3. Returning a `JsonResource` or standard `response()->json()`.
- **Pagination/Filtering:** Extract request queries (e.g., `$request->pageIndex`, `$request->search`) into an array and pass it to the Service.

### 2. Services (Business Logic Layer)
- Services MUST inject a `RepositoryInterface` (e.g., `TaskRepositoryInterface`), NOT the concrete class.
- Services handle all business logic, condition checking, formatting, and calling external APIs.
- Do NOT use Eloquent or DB facades directly in the Service. Delegate data fetching/saving to the Repository.

### 3. Interfaces (Contracts)
- Define clean, typeless or loosely-typed method signatures (matching the `ThreeDOS-LMS-APIs` standard).
- Example: `public function getAllTasks(array $filters);`
- Do NOT enforce strict Eloquent return types in the interface to maintain true decoupling.

### 4. Repositories (Data Access Layer)
- The Repository is the ONLY place where Eloquent models (`Model::query()`, `Model::where()`) are allowed.
- Repositories MUST `implements` their respective Interface.
- **Pagination & Filtering:** Handle `where()`, `like`, and `paginate()` directly inside the repository methods based on the `$filters` array passed from the service.

### 5. Service Providers
- Every new Interface/Repository pair MUST be bound in `app/Providers/AppServiceProvider.php` (or `RepositoryServiceProvider`).
- Example: `$this->app->bind(\App\Interfaces\UserRepositoryInterface::class, \App\Repositories\UserRepository::class);`

---

## 💻 CODE EXAMPLES (The Standard)

### 1. The Interface (`app/Interfaces/TaskRepositoryInterface.php`)
```php
namespace App\Interfaces;

interface TaskRepositoryInterface
{
    public function getAllTasks(array $filters);
    public function getTaskById($taskId);
    public function createTask(array $data);
}
```

### 2. The Repository (`app/Repositories/TaskRepository.php`)
```php
namespace App\Repositories;

use App\Interfaces\TaskRepositoryInterface;
use App\Models\Task;

class TaskRepository implements TaskRepositoryInterface
{
    public function getAllTasks(array $filters)
    {
        $query = Task::query();

        if (isset($filters['search'])) {
            $query->where('title', 'like', "%{$filters['search']}%");
        }

        $pageSize = $filters['pageSize'] ?? 15;
        return $query->paginate($pageSize);
    }

    public function getTaskById($taskId)
    {
        return Task::findOrFail($taskId);
    }

    public function createTask(array $data)
    {
        return Task::create($data);
    }
}
```

### 3. The Service (`app/Services/TaskService.php`)
```php
namespace App\Services;

use App\Interfaces\TaskRepositoryInterface;

class TaskService
{
    protected $taskRepository;

    public function __construct(TaskRepositoryInterface $taskRepository)
    {
        $this->taskRepository = $taskRepository;
    }

    public function getAllTasks(array $filters)
    {
        return $this->taskRepository->getAllTasks($filters);
    }

    public function createTask(array $data)
    {
        // Business logic goes here...
        return $this->taskRepository->createTask($data);
    }
}
```

### 4. The Controller (`app/Http/Controllers/TaskController.php`)
```php
namespace App\Http\Controllers;

use App\Services\TaskService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    protected $taskService;

    public function __construct(TaskService $taskService)
    {
        $this->taskService = $taskService;
    }

    public function index(Request $request)
    {
        $tasks = $this->taskService->getAllTasks([
            'search' => $request->input('search'),
            'pageSize' => $request->input('pageSize', 15),
        ]);

        return response()->json(['data' => $tasks]);
    }
}
```

---

## 🌳 CURRENT PROJECT FILE TREE
```text├── .github
│   ├── ISSUE_TEMPLATE
│   │   ├── bug-report.yml
│   │   └── task-card.yml
│   └── workflows
│       └── ci.yml
├── app
│   ├── Console
│   │   └── Commands
│   │       ├── ExportPostman.php
│   │       ├── SeedFresh.php
│   │       └── SyncFixtures.php
│   ├── Enums
│   │   ├── BookingStatus.php
│   │   ├── BudgetLevel.php
│   │   ├── CommissionStatus.php
│   │   ├── ContactMessageStatus.php
│   │   ├── ExperienceStatus.php
│   │   ├── FlightStatus.php
│   │   ├── NotificationStatus.php
│   │   ├── OrderStatus.php
│   │   ├── PaymentStatus.php
│   │   ├── ReviewStatus.php
│   │   ├── SubscriptionStatus.php
│   │   └── TripStatus.php
│   ├── Events
│   │   ├── PaymentFailed.php
│   │   └── PaymentSucceeded.php
│   ├── Exceptions
│   │   └── ApiExceptionHandler.php
│   ├── Http
│   │   ├── Controllers
│   │   │   ├── Admin
│   │   │   │   ├── AdminAnalyticsController.php
│   │   │   │   ├── AdminAttractionController.php
│   │   │   │   ├── AdminCategoryController.php
│   │   │   │   ├── AdminCountryController.php
│   │   │   │   ├── AdminFlightController.php
│   │   │   │   ├── AdminHotelController.php
│   │   │   │   ├── AdminNotificationController.php
│   │   │   │   ├── AdminRestaurantController.php
│   │   │   │   ├── AdminReviewController.php
│   │   │   │   ├── AdminTripController.php
│   │   │   │   ├── AdminUserController.php
│   │   │   │   ├── ContactMessageController.php
│   │   │   │   ├── DestinationController.php
│   │   │   │   └── SettingController.php
│   │   │   ├── AdminSetSubscriptionPlanController.php
│   │   │   ├── AIController.php
│   │   │   ├── AttractionController.php
│   │   │   ├── AuthController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── CheckoutController.php
│   │   │   ├── ContactController.php
│   │   │   ├── Controller.php
│   │   │   ├── DashboardController.php
│   │   │   ├── DestinationController.php
│   │   │   ├── FlightController.php
│   │   │   ├── HotelController.php
│   │   │   ├── InteractionController.php
│   │   │   ├── MapController.php
│   │   │   ├── NotificationController.php
│   │   │   ├── PaymobController.php
│   │   │   ├── PaymobWebhookController.php
│   │   │   ├── PlanController.php
│   │   │   ├── ReportController.php
│   │   │   ├── RestaurantController.php
│   │   │   ├── SiteSettingsController.php
│   │   │   ├── SurveyController.php
│   │   │   ├── TripController.php
│   │   │   └── WeatherController.php
│   │   ├── Requests
│   │   │   ├── Admin
│   │   │   │   ├── StoreDestinationRequest.php
│   │   │   │   ├── StoreFlightRequest.php
│   │   │   │   ├── UpdateDestinationRequest.php
│   │   │   │   └── UpdateFlightRequest.php
│   │   │   ├── Auth
│   │   │   │   ├── ForgotPasswordRequest.php
│   │   │   │   ├── LoginRequest.php
│   │   │   │   ├── RegisterRequest.php
│   │   │   │   ├── ResendVerificationRequest.php
│   │   │   │   ├── ResetPasswordRequest.php
│   │   │   │   └── UpdateProfileRequest.php
│   │   │   ├── SurveyRequests
│   │   │   │   └── SurveyStoreRequest.php
│   │   │   ├── AdminAtrractionRequest.php
│   │   │   ├── AdminSetPlansRequest.php
│   │   │   ├── AdminSetSubscriptionPlanRequest.php
│   │   │   ├── AiTripRequest.php
│   │   │   ├── GenerateReportRequest.php
│   │   │   ├── InitiateCheckoutRequest.php
│   │   │   ├── ShowWeatherRequest.php
│   │   │   ├── StoreAttractionRequest.php
│   │   │   ├── StoreCategoryRequest.php
│   │   │   ├── StoreContactMessageRequest.php
│   │   │   ├── StoreCountryRequest.php
│   │   │   ├── StoreHotelRequest.php
│   │   │   ├── StoreRestaurantRequest.php
│   │   │   ├── StoreReviewRequest.php
│   │   │   ├── StoreTripRequest.php
│   │   │   ├── StoreUserRequest.php
│   │   │   ├── SubscribePlanRequest.php
│   │   │   ├── UpdateAttractionRequest.php
│   │   │   ├── UpdateCategoryRequest.php
│   │   │   ├── UpdateCountryRequest.php
│   │   │   ├── UpdateHotelRequest.php
│   │   │   ├── UpdateRestaurantRequest.php
│   │   │   ├── UpdateSettingRequest.php
│   │   │   ├── UpdateSettingValueRequest.php
│   │   │   ├── UpdateTripRequest.php
│   │   │   ├── UpdateUserRequest.php
│   │   │   └── UpgradePlanRequest.php
│   │   └── Resources
│   │       ├── AttractionResource.php
│   │       ├── AuthResource.php
│   │       ├── CategoryResource.php
│   │       ├── ContactMessageResource.php
│   │       ├── DestinationResource.php
│   │       ├── FavouriteResource.php
│   │       ├── FlightResource.php
│   │       ├── HotelResource.php
│   │       ├── RestaurantResource.php
│   │       ├── ReviewResource.php
│   │       ├── TripResource.php
│   │       └── UserResource.php
│   ├── Interfaces
│   │   ├── AttractionRepositoryInterface.php
│   │   ├── CategoryRepositoryInterface.php
│   │   ├── ContactMessageRepositoryInterface.php
│   │   ├── CountryRepositoryInterface.php
│   │   ├── DestinationRepositoryInterface.php
│   │   ├── FlightRepositoryInterface.php
│   │   ├── HotelRepositoryInterface.php
│   │   ├── OrderRepositoryInterface.php
│   │   ├── PaymentGatewayInterface.php
│   │   ├── PaymentRepositoryInterface.php
│   │   ├── PlanRepositoryInterface.php
│   │   ├── RestaurantRepositoryInterface.php
│   │   ├── ReviewRepositoryInterface.php
│   │   ├── SettingRepositoryInterface.php
│   │   ├── SurveyRepositoryInterface.php
│   │   ├── TripRepositoryInterface.php
│   │   └── UserRepositoryInterface.php
│   ├── Jobs
│   │   └── GenerateReportJob.php
│   ├── Listeners
│   │   ├── FulfillOrderListener.php
│   │   └── HandlePaymentFailed.php
│   ├── Mail
│   │   ├── PaymentFailedMail.php
│   │   ├── PaymentSuccessMail.php
│   │   ├── SubscriptionActivatedMail.php
│   │   ├── TripForkedMail.php
│   │   └── WelcomeMail.php
│   ├── Models
│   │   ├── Address.php
│   │   ├── AiRecommendation.php
│   │   ├── Attraction.php
│   │   ├── Booking.php
│   │   ├── BookingItem.php
│   │   ├── BudgetSnapshot.php
│   │   ├── Category.php
│   │   ├── Commission.php
│   │   ├── Company.php
│   │   ├── ContactMessage.php
│   │   ├── Country.php
│   │   ├── Destination.php
│   │   ├── EntityView.php
│   │   ├── Experience.php
│   │   ├── ExperienceProvider.php
│   │   ├── Favourite.php
│   │   ├── Flight.php
│   │   ├── Hotel.php
│   │   ├── ItineraryItem.php
│   │   ├── Notification.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   ├── Payment.php
│   │   ├── Plan.php
│   │   ├── Report.php
│   │   ├── Restaurant.php
│   │   ├── Review.php
│   │   ├── Role.php
│   │   ├── Setting.php
│   │   ├── Subscription.php
│   │   ├── Survey.php
│   │   ├── Transaction.php
│   │   ├── Trip.php
│   │   ├── TripContribution.php
│   │   ├── TripDestination.php
│   │   ├── User.php
│   │   └── UserPoint.php
│   ├── Notifications
│   │   ├── AppNotification.php
│   │   ├── PaymentFailedNotification.php
│   │   ├── PaymentSucceededNotification.php
│   │   ├── SubscriptionActivatedNotification.php
│   │   ├── TripForkedNotification.php
│   │   └── WelcomeNotification.php
│   ├── Providers
│   │   ├── AppServiceProvider.php
│   │   └── TelescopeServiceProvider.php
│   ├── Queries
│   │   └── ReportQuery.php
│   ├── Repositories
│   │   ├── AttractionRepository.php
│   │   ├── CategoryRepository.php
│   │   ├── ContactMessageRepository.php
│   │   ├── CountryRepository.php
│   │   ├── DestinationRepository.php
│   │   ├── FlightRepository.php
│   │   ├── HotelRepository.php
│   │   ├── OrderRepository.php
│   │   ├── PaymentRepository.php
│   │   ├── PlanRepository.php
│   │   ├── RestaurantRepository.php
│   │   ├── ReviewRepository.php
│   │   ├── SettingRepository.php
│   │   ├── SurveyRepository.php
│   │   ├── TripRepository.php
│   │   └── UserRepository.php
│   ├── Services
│   │   ├── Fixtures
│   │   │   ├── CountryFixtureService.php
│   │   │   ├── FlightFixtureService.php
│   │   │   ├── HotelFixtureService.php
│   │   │   ├── OpenStreetService.php
│   │   │   └── RestaurantFixtureService.php
│   │   ├── AiUsageService.php
│   │   ├── AttractionService.php
│   │   ├── CategoryService.php
│   │   ├── CheckoutService.php
│   │   ├── ContactMessageService.php
│   │   ├── CountryService.php
│   │   ├── DestinationService.php
│   │   ├── FlightService.php
│   │   ├── GenerateReportService.php
│   │   ├── GroqService.php
│   │   ├── HotelService.php
│   │   ├── OpenMeteoService.php
│   │   ├── PaymobGateway.php
│   │   ├── PlanService.php
│   │   ├── PriceCalculatorService.php
│   │   ├── RestaurantService.php
│   │   ├── ReviewService.php
│   │   ├── SettingService.php
│   │   ├── StripeGateway.php
│   │   ├── SurveyService.php
│   │   ├── TripForkService.php
│   │   ├── TripService.php
│   │   ├── UserService.php
│   │   └── WebhookService.php
│   ├── Strategies
│   │   └── Checkout
│   │       ├── CheckoutStrategyFactory.php
│   │       ├── CheckoutStrategyInterface.php
│   │       ├── SubscriptionStrategy.php
│   │       ├── TripForkStrategy.php
│   │       └── TripPackageStrategy.php
│   └── Support
│       └── ApiResponse.php
├── bootstrap
│   ├── cache
│   │   ├── .gitignore
│   │   ├── packages.php
│   │   └── services.php
│   ├── app.php
│   └── providers.php
├── config
│   ├── app.php
│   ├── auth.php
│   ├── cache.php
│   ├── database.php
│   ├── dompdf.php
│   ├── filesystems.php
│   ├── groq.php
│   ├── jwt.php
│   ├── logging.php
│   ├── mail.php
│   ├── paymob.php
│   ├── permission.php
│   ├── queue.php
│   ├── scramble.php
│   ├── services.php
│   ├── session.php
│   └── telescope.php
├── database
│   ├── factories
│   │   ├── AiRecommendationFactory.php
│   │   ├── AttractionFactory.php
│   │   ├── CategoryFactory.php
│   │   ├── ContactMessageFactory.php
│   │   ├── CountryFactory.php
│   │   ├── DestinationFactory.php
│   │   ├── FavouriteFactory.php
│   │   ├── FlightFactory.php
│   │   ├── HotelFactory.php
│   │   ├── ItineraryItemFactory.php
│   │   ├── NotificationFactory.php
│   │   ├── PlanFactory.php
│   │   ├── ReportFactory.php
│   │   ├── RestaurantFactory.php
│   │   ├── ReviewFactory.php
│   │   ├── RoleFactory.php
│   │   ├── SettingFactory.php
│   │   ├── SubscriptionFactory.php
│   │   ├── SurveyFactory.php
│   │   ├── TripDestinationFactory.php
│   │   ├── TripFactory.php
│   │   ├── TripItemFactory.php
│   │   └── UserFactory.php
│   ├── migrations
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   ├── 0001_01_01_000002_create_jobs_table.php
│   │   ├── 2026_07_30_185256_create_telescope_entries_table.php
│   │   ├── 2026_08_01_011209_create_notifications_table.php
│   │   ├── 2026_08_01_011454_create_settings_table.php
│   │   ├── 2026_08_01_013351_create_surveys_table.php
│   │   ├── 2026_08_01_015131_create_countries_table.php
│   │   ├── 2026_08_01_020111_create_categories_table.php
│   │   ├── 2026_08_01_020159_create_destinations_table.php
│   │   ├── 2026_08_01_020616_create_resturants_table.php
│   │   ├── 2026_08_01_021537_create_trips_table.php
│   │   ├── 2026_08_01_021650_create_flight_table.php
│   │   ├── 2026_08_01_021950_create_trip_destinations_table.php
│   │   ├── 2026_08_01_024753_create_favourites_table.php
│   │   ├── 2026_08_01_024855_create_hotels_table.php
│   │   ├── 2026_08_01_025941_create_contact_message_table.php
│   │   ├── 2026_08_01_031451_creat_itinerary_item_table.php
│   │   ├── 2026_08_01_033715_create_attraction_table.php
│   │   ├── 2026_08_01_035221_create_ai_recommendation_table.php
│   │   ├── 2026_08_01_036416_create_reviews_table.php
│   │   ├── 2026_08_01_112147_create_personal_access_tokens_table.php
│   │   ├── 2026_08_01_180000_create_trip_items_table.php
│   │   ├── 2026_08_02_075042_create_permission_tables.php
│   │   ├── 2026_08_04_103834_add_is_active_to_users_table.php
│   │   ├── 2026_08_06_052336_create_experienceproviders_table.php
│   │   ├── 2026_08_06_052422_create_experiences_table.php
│   │   ├── 2026_08_06_052507_create_addresses_table.php
│   │   ├── 2026_08_06_052540_create_companies_table.php
│   │   ├── 2026_08_06_052621_create_bookings_table.php
│   │   ├── 2026_08_06_052713_create_booking_items_table.php
│   │   ├── 2026_08_06_052844_create_transactions_table.php
│   │   ├── 2026_08_06_052920_create_payments_table.php
│   │   ├── 2026_08_06_053001_create_commissions_table.php
│   │   ├── 2026_08_06_053048_create_budget_snapshots_table.php
│   │   ├── 2026_08_06_053141_create_entity_views_table.php
│   │   ├── 2026_08_06_053236_create_user_points_table.php
│   │   ├── 2026_08_06_053405_create_trip_contributions_table.php
│   │   ├── 2026_08_06_060000_create_plans_table.php
│   │   ├── 2026_08_06_060001_create_subscriptions_table.php
│   │   ├── 2026_08_06_060002_add_ai_quota_to_users_table.php
│   │   ├── 2026_08_06_200259_create_reports_table.php
│   │   ├── 2026_08_07_235716_create_orders_table.php
│   │   ├── 2026_08_07_235717_create_order_items_table.php
│   │   ├── 2026_08_07_235749_alter_payments_table_for_orders.php
│   │   ├── 2026_08_07_235750_alter_trips_table_for_forks.php
│   │   ├── 2026_08_08_134642_alter_notifications_table_for_native_hybrid.php
│   │   ├── 2026_08_08_140000_add_soft_deletes_to_reviews_table.php
│   │   └── 2026_08_08_150000_add_status_to_reports_table.php
│   ├── seeders
│   │   ├── fixtures
│   │   │   ├── _meta.json
│   │   │   ├── countries.json
│   │   │   ├── countries.json.bak
│   │   │   ├── flights.json
│   │   │   ├── flights.json.bak
│   │   │   ├── hotels.json
│   │   │   └── restaurants.json
│   │   ├── AddressSeeder.php
│   │   ├── AttractionSeeder.php
│   │   ├── BookingItemSeeder.php
│   │   ├── BookingSeeder.php
│   │   ├── BudgetSnapshotSeeder.php
│   │   ├── CategorySeeder.php
│   │   ├── CommissionSeeder.php
│   │   ├── CompanySeeder.php
│   │   ├── CountrySeeder.php
│   │   ├── DatabaseSeeder.php
│   │   ├── DestinationSeeder.php
│   │   ├── EntityViewSeeder.php
│   │   ├── ExperienceProviderSeeder.php
│   │   ├── ExperienceSeeder.php
│   │   ├── FavouriteSeeder.php
│   │   ├── FlightSeeder.php
│   │   ├── HotelSeeder.php
│   │   ├── ItineraryItemSeeder.php
│   │   ├── NotificationSeeder.php
│   │   ├── PaymentSeeder.php
│   │   ├── PlanSeeder.php
│   │   ├── RestaurantSeeder.php
│   │   ├── ReviewSeeder.php
│   │   ├── RoleAndPermissionSeeder.php
│   │   ├── SettingsSeeder.php
│   │   ├── TransactionSeeder.php
│   │   ├── TripContributionSeeder.php
│   │   ├── TripSeeder.php
│   │   └── UserPointSeeder.php
│   ├── .gitignore
│   └── database.sqlite
├── docs
│   ├── scripts
│   │   ├── scripts
│   │   │   └── create_issues.ps1
│   │   ├── add_spatie_middleware.cjs
│   │   ├── apply_best_practices.cjs
│   │   ├── generate_notion_architecture.cjs
│   │   ├── KNOWLEDGE_BASE.md
│   │   ├── push_to_notion.ps1
│   │   ├── rearrange_sprints.cjs
│   │   ├── rebuild_sprint.cjs
│   │   ├── refactor.cjs
│   │   ├── update_fixtures_path.cjs
│   │   └── update_v1_conventions.cjs
│   ├── ThreeDOS_Seeders
│   │   └── Logs
│   │       ├── load_test_output.log
│   │       └── seeder_output.log
│   ├── DEPLOYMENT.md
│   ├── ENVIRONMENT.md
│   ├── frontend-data-fetching-fix-plan.md
│   ├── frontend-data-fetching-investigation.md
│   ├── notifications-architecture-research.md
│   ├── payment-final-audit.md
│   ├── payment-implementation-plan.md
│   ├── payment-monetization-analysis.md
│   ├── plans-user-journey.md
│   └── RELEASE_SIGN_OFF.md
├── frontend
│   ├── admin
│   │   ├── analytics.html
│   │   ├── attractions.html
│   │   ├── countries.html
│   │   ├── destinations.html
│   │   ├── hotels.html
│   │   ├── index.html
│   │   ├── restaurants.html
│   │   ├── reviews.html
│   │   ├── settings.html
│   │   ├── trips.html
│   │   ├── user-details.html
│   │   └── users.html
│   ├── assets
│   │   ├── css
│   │   │   ├── admin.css
│   │   │   ├── auth.css
│   │   │   ├── dashboard.css
│   │   │   └── tokens.css
│   │   └── js
│   │       ├── admin-activity.js
│   │       ├── admin-analytics.js
│   │       ├── admin-chrome.js
│   │       ├── admin-crud.js
│   │       ├── admin-dashboard.js
│   │       ├── admin-settings.js
│   │       ├── admin-shell.js
│   │       ├── admin-user-details.js
│   │       ├── animations.js
│   │       ├── api.js
│   │       ├── auth.js
│   │       ├── config.js
│   │       ├── dashboard.js
│   │       ├── password-toggle.js
│   │       ├── session.js
│   │       └── validation.js
│   ├── tasks
│   │   ├── plan.md
│   │   └── todo.md
│   ├── dashboard.html
│   ├── forgot.html
│   ├── login.html
│   ├── README.md
│   ├── register.html
│   ├── reset.html
│   └── verify.html
├── public
│   ├── storage
│   │   └── .gitignore
│   ├── .htaccess
│   ├── favicon.ico
│   ├── index.php
│   └── robots.txt
├── refine-upload
│   ├── admin
│   │   ├── analytics.html
│   │   ├── attractions.html
│   │   ├── countries.html
│   │   ├── destinations.html
│   │   ├── hotels.html
│   │   ├── index.html
│   │   ├── restaurants.html
│   │   ├── reviews.html
│   │   ├── settings.html
│   │   ├── trips.html
│   │   ├── user-details.html
│   │   └── users.html
│   ├── assets
│   │   ├── css
│   │   │   ├── admin.css
│   │   │   ├── admin.css.bak
│   │   │   ├── auth.css
│   │   │   ├── auth.css.bak
│   │   │   ├── dashboard.css
│   │   │   ├── dashboard.css.bak
│   │   │   └── tokens.css
│   │   └── js
│   │       ├── admin-activity.js
│   │       ├── admin-analytics.js
│   │       ├── admin-chrome.js
│   │       ├── admin-countries.js
│   │       ├── admin-crud.js
│   │       ├── admin-dashboard.js
│   │       ├── admin-destinations.js
│   │       ├── admin-hotels.js
│   │       ├── admin-kit.js
│   │       ├── admin-restaurants.js
│   │       ├── admin-settings.js
│   │       ├── admin-shell.js
│   │       ├── admin-user-details.js
│   │       ├── animations.js
│   │       ├── api.js
│   │       ├── auth.js
│   │       ├── config.js
│   │       ├── dashboard.js
│   │       ├── password-toggle.js
│   │       ├── session.js
│   │       └── validation.js
│   ├── tasks
│   │   ├── plan.md
│   │   └── todo.md
│   ├── dashboard.html
│   ├── forgot.html
│   ├── index.html
│   ├── login.html
│   ├── README.md
│   ├── register.html
│   ├── reset.html
│   └── verify.html
├── resources
│   ├── css
│   │   └── app.css
│   ├── js
│   │   ├── app.js
│   │   └── bootstrap.js
│   └── views
│       ├── emails
│       │   ├── layouts
│       │   │   └── main.blade.php
│       │   ├── payment-failed.blade.php
│       │   ├── payment-success.blade.php
│       │   ├── subscription-activated.blade.php
│       │   ├── trip-forked.blade.php
│       │   └── welcome.blade.php
│       ├── reports
│       │   └── booking-report.blade.php
│       └── welcome.blade.php
├── routes
│   ├── api.php
│   ├── console.php
│   └── web.php
├── storage
│   ├── app
│   │   ├── private
│   │   │   └── .gitignore
│   │   ├── public
│   │   │   └── .gitignore
│   │   └── .gitignore
│   ├── framework
│   │   ├── cache
│   │   │   ├── data
│   │   │   │   └── .gitignore
│   │   │   └── .gitignore
│   │   ├── sessions
│   │   │   └── .gitignore
│   │   ├── testing
│   │   │   ├── disks
│   │   │   │   └── public
│   │   │   └── .gitignore
│   │   ├── views
│   │   │   ├── .gitignore
│   │   │   ├── 044a1c446d15e585476052eb40788840.php
│   │   │   ├── 1142d779c5d669d390708088cc78ec06.php
│   │   │   ├── 1c37b12693a8e220b466c71670c6b2b0.php
│   │   │   ├── 37023dba3d2e57ba22187f06f605b0a9.php
│   │   │   ├── 37e171d1d2a20f0cdbbdba44a3d990c8.php
│   │   │   ├── 40521a7b0d4aa50648c4c82458afe575.php
│   │   │   ├── 40d4d0fb35d3c9e1a031e584d882a491.php
│   │   │   ├── 5081ac1666728fb92dda20373b7b3d40.php
│   │   │   ├── 5231d46ad41e6d03bc99c773d99020c1.php
│   │   │   ├── 6b9f852e0776d4d86f9c8941a0bf54dc.php
│   │   │   ├── 750008d900a6a91750389c638d7820d1.php
│   │   │   ├── 79504809fbb542076dba5928699b745c.php
│   │   │   ├── 8656be4296533c12262e84a6b9f18858.php
│   │   │   ├── 9d1fc42e07413382bb86b0a315a9ddb1.php
│   │   │   ├── ace2246bdd64cf595ebba13b142c9ba2.php
│   │   │   ├── b7b623a9d1cff81d4beaeeefdbcfefef.php
│   │   │   ├── d39bd0947e6a627b7aab95fa4397014c.php
│   │   │   ├── f0526bad539c71b079bf9b4da9289509.php
│   │   │   ├── f884647ac91020db1b8318c257d69457.php
│   │   │   ├── f92ad5e634b64ccc7725c5effe960805.php
│   │   │   └── fd4fdcfaa192421825492bf9fba04a42.php
│   │   └── .gitignore
│   └── logs
│       ├── .gitignore
│       └── laravel.log
├── tasks
│   ├── plan.md
│   └── todo.md
├── tests
│   ├── Feature
│   │   ├── Admin
│   │   │   ├── AttractionTest.php
│   │   │   ├── CategoryTest.php
│   │   │   ├── CountryTest.php
│   │   │   ├── DestinationTest.php
│   │   │   ├── HotelTest.php
│   │   │   ├── RestaurantTest.php
│   │   │   └── UserTest.php
│   │   ├── AiFeatureTest.php
│   │   ├── AuthThrottleTest.php
│   │   ├── ConcurrencyTest.php
│   │   ├── ContactAndSettingsTest.php
│   │   ├── EmailIntegrationTest.php
│   │   ├── ExampleTest.php
│   │   ├── MapCacheTest.php
│   │   ├── PaymentFlowTest.php
│   │   ├── PlansTest.php
│   │   ├── ReportTest.php
│   │   ├── Sprint1IntegrationTest.php
│   │   ├── VerificationTest.php
│   │   └── WeatherCacheTest.php
│   ├── Unit
│   │   ├── ExampleTest.php
│   │   └── Sprint1UnitTest.php
│   └── TestCase.php
├── .editorconfig
├── .env
├── .env.example
├── .gitattributes
├── .gitignore
├── .phpunit.result.cache
├── artisan
├── BACKEND_AUDIT.md
├── composer.json
├── composer.lock
├── frontend.zip
├── frontend-backend-api-contract.md
├── frontend-backend-integration-audit.md
├── frontend-backend-refinement-plan.md
├── frontend-clean-code-guidelines.md
├── gen-tree.ps1
├── gitleaks.toml
├── load_test.php
├── package.json
├── phpunit.xml
├── postman_collection.json
├── README.md
├── test-err.php
├── test-ssl.php
├── tree.txt
└── vite.config.js
```
