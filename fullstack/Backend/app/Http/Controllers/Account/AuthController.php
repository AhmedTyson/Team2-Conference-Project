<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\Auth\ForgotPasswordRequest;
use App\Http\Requests\Account\Auth\LoginRequest;
use App\Http\Requests\Account\Auth\RegisterRequest;
use App\Http\Requests\Account\Auth\ResetPasswordRequest;
use App\Http\Requests\Account\Auth\UpdateProfileRequest;
use App\Models\Account\Role;
use App\Models\Account\User;
use App\Notifications\WelcomeNotification;
use App\Support\ApiResponse;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    // Register a new user
    public function register(RegisterRequest $request): JsonResponse
    {

        $role = Role::firstOrCreate(['name' => 'user']);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
        ]);

        $user->assignRole($role);
        $user->sendEmailVerificationNotification();
        $user->notify(new WelcomeNotification);

        $token = auth('api')
            ->claims(['roles' => $user->getRoleNames()->toArray()])
            ->login($user);

        return ApiResponse::success([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'phone' => $user->phone,
            ],
        ], 'user created', 201);
    }

    // Verify email & login
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');
        $user = User::where('email', $request->email)->first();

        if ($user && ! $user->is_active) {
            return ApiResponse::fail(
                'Invalid email or password',
                'invalid_credentials',
                401
            );
        }

        $token = $user
            ? auth('api')->claims(['roles' => $user->getRoleNames()->toArray()])->attempt($credentials)
            : null;

        if (! $token) {
            return ApiResponse::fail(
                'Invalid email or password',
                'invalid_credentials',
                401
            );
        }

        $user = auth('api')->user();

        return ApiResponse::success([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),

            ],
        ], 'user logged in successfully');
    }

    // Profile
    public function me(): JsonResponse
    {
        $user = auth('api')->user();
        $addrRecord = $user->address()->first();
        $formattedAddress = $addrRecord ? $addrRecord->line1 : $user->getAttribute('address');

        $activeSub = $user->subscriptions()->where('status', 'active')->latest()->first();
        $plan = $activeSub ? $activeSub->plan : null;

        $planName = $plan ? $plan->name : 'Free Explorer';
        $totalQuota = $plan ? (int) $plan->ai_quota_monthly : (int) config('ai.rate_limit_per_day', 500);
        if ($totalQuota <= 0) {
            $totalQuota = 500;
        }
        $usedQuota = (int) ($user->ai_generations_count ?? 0);
        $remainingQuota = max(0, $totalQuota - $usedQuota);

        return ApiResponse::success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'phone' => $user->phone,
                'bio' => $user->bio,
                'country' => $user->country,
                'address' => $formattedAddress,
                'address_details' => $addrRecord ? [
                    'line1' => $addrRecord->line1,
                    'line2' => $addrRecord->line2,
                    'city' => $addrRecord->city,
                    'state' => $addrRecord->state,
                    'country' => $addrRecord->country,
                    'postal_code' => $addrRecord->postal_code,
                ] : null,
                'preferred_currency' => $user->preferred_currency,
                'emergency_contact' => $user->emergency_contact,
                'profile_image' => $user->profile_image
                    ? (str_starts_with($user->profile_image, 'http') ? $user->profile_image : url($user->profile_image))
                    : null,
                'email_verified_at' => $user->email_verified_at,
                'subscription' => [
                    'plan_id' => $plan ? $plan->id : null,
                    'plan_name' => $planName,
                    'status' => $activeSub ? $activeSub->status : 'active',
                    'ai_quota_total' => $totalQuota,
                    'ai_quota_used' => $usedQuota,
                    'ai_quota_remaining' => $remainingQuota,
                    'renews_at' => $activeSub ? $activeSub->renews_at : null,
                ],
            ],
        ]);
    }

    // verfication notifaction
    public function verificationNotice(): JsonResponse
    {
        return ApiResponse::fail(
            'Please verify your email address.',
            'email_not_verified',
            403
        );
    }

    // verify Email
    public function verifyEmail(Request $request, $id, $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals(
            (string) $hash,
            sha1($user->getEmailForVerification())
        )) {
            return ApiResponse::fail('Invalid verification link', 'invalid_verification_link', 403);
        }

        if ($user->hasVerifiedEmail()) {
            return ApiResponse::success([], 'Email already verified');
        }

        $user->markEmailAsVerified();

        event(new Verified($user));

        return ApiResponse::success([], 'Email verified successfully');
    }

    // Resend the verification email
    public function resendVerificationEmail(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return ApiResponse::success([], 'Email already verified.');
        }

        $request->user()->sendEmailVerificationNotification();

        return ApiResponse::success([], 'Verification link sent successfully.');
    }

    // LOGOUT
    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return ApiResponse::success([], 'User Logged out Successfully');
    }

    // Refresh
    public function refresh(): JsonResponse
    {
        $token = auth('api')->refresh();

        return ApiResponse::success(['token' => $token]);
    }

    // ForgetPass
    public function forgetPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $stat = Password::sendResetLink($request->only('email'));

        if ($stat == Password::RESET_LINK_SENT) {
            return ApiResponse::success(null, __($stat));
        }

        return ApiResponse::fail(__($stat), 'reset_link_failed', 422);
    }

    // ResetPass
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $stat = Password::reset(
            $request->only(
                'email',
                'password',
                'password_confirmation',
                'token'
            ),
            function (User $user, string $password) {
                $user->update([
                    'password' => Hash::make($password),
                ]);
            }
        );

        if ($stat == Password::PASSWORD_RESET) {
            return ApiResponse::success([], 'Passwrod reset successfully');
        }

        return ApiResponse::fail((string) $stat, 'reset_failed', 422);

    }

    // Update the authenticated user's own profile
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = auth('api')->user();
        $data = $request->validated();

        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $ext = strtolower($file->getClientOriginalExtension()) ?: 'png';
            $fileName = time().'_'.uniqid().'.'.$ext;
            $uploadDir = public_path('uploads/profile-images');
            if (! file_exists($uploadDir)) {
                @mkdir($uploadDir, 0777, true);
            }
            $file->move($uploadDir, $fileName);
            $data['profile_image'] = 'uploads/profile-images/'.$fileName;
        } elseif (! empty($data['profile_image']) && is_string($data['profile_image'])) {
            if (str_starts_with($data['profile_image'], 'data:image/')) {
                try {
                    preg_match('/data:image\/(?<type>.*?);base64,(?<data>.*)/', $data['profile_image'], $matches);
                    $imageType = $matches['type'] ?? 'png';
                    $imageData = base64_decode($matches['data'] ?? '');
                    $fileName = time().'_'.uniqid().'.'.$imageType;
                    $uploadDir = public_path('uploads/profile-images');
                    if (! file_exists($uploadDir)) {
                        @mkdir($uploadDir, 0777, true);
                    }
                    file_put_contents($uploadDir.'/'.$fileName, $imageData);
                    $data['profile_image'] = 'uploads/profile-images/'.$fileName;
                } catch (\Throwable $e) {
                    // Ignore malformed base64
                }
            }
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $emailChanged = isset($data['email']) && $data['email'] !== $user->email;

        if ($emailChanged) {
            // Not fillable — set explicitly to invalidate verification on email change.
            $user->email_verified_at = null;
        }

        $user->update($data);

        if (isset($data['address']) || isset($data['line1'])) {
            $line1 = $data['line1'] ?? $data['address'];
            if ($line1) {
                $user->address()->updateOrCreate(
                    ['addressable_id' => $user->id, 'addressable_type' => get_class($user)],
                    [
                        'line1' => $line1,
                        'line2' => $data['line2'] ?? null,
                        'city' => $data['city'] ?? ($data['country'] ?? 'Cairo'),
                        'state' => $data['state'] ?? null,
                        'country' => $data['country'] ?? ($user->country ?? 'Egypt'),
                        'postal_code' => $data['postal_code'] ?? null,
                    ]
                );
            }
        }

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        $addrRecord = $user->address()->first();
        $formattedAddress = $addrRecord ? $addrRecord->line1 : $user->getAttribute('address');

        return ApiResponse::success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'bio' => $user->bio,
                'country' => $user->country,
                'address' => $formattedAddress,
                'address_details' => $addrRecord ? [
                    'line1' => $addrRecord->line1,
                    'line2' => $addrRecord->line2,
                    'city' => $addrRecord->city,
                    'state' => $addrRecord->state,
                    'country' => $addrRecord->country,
                    'postal_code' => $addrRecord->postal_code,
                ] : null,
                'preferred_currency' => $user->preferred_currency,
                'emergency_contact' => $user->emergency_contact,
                'profile_image' => $user->profile_image
                    ? (str_starts_with($user->profile_image, 'http') ? $user->profile_image : url($user->profile_image))
                    : null,
                'roles' => $user->getRoleNames(),
            ],
        ], $emailChanged
            ? 'Profile updated successfully. A verification link was sent to your new email address.'
            : 'Profile updated successfully.');
    }
}
