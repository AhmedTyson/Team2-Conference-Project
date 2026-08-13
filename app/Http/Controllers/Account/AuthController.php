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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    // Register a new user
    public function register(RegisterRequest $request)
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
    public function login(LoginRequest $request)
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
    public function me()
    {
        $user = auth('api')->user();

        return ApiResponse::success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'phone' => $user->phone,
            ],
        ]);
    }

    // verfication notifaction
    public function verificationNotice()
    {
        return ApiResponse::fail(
            'Please verify your email address.',
            'email_not_verified',
            403
        );
    }

    // verify Email
    public function verifyEmail(Request $request, $id, $hash)
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
    public function resendVerificationEmail(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return ApiResponse::success([], 'Email already verified.');
        }

        $request->user()->sendEmailVerificationNotification();

        return ApiResponse::success([], 'Verification link sent successfully.');
    }

    // LOGOUT
    public function logout()
    {
        auth('api')->logout();

        return ApiResponse::success([], 'User Logged out Successfully');
    }

    // Refresh
    public function refresh()
    {
        $token = auth('api')->refresh();

        return ApiResponse::success(['token' => $token]);
    }

    // ForgetPass
    public function forgetPassword(ForgotPasswordRequest $request)
    {
        $stat = Password::sendResetLink($request->only('email'));

        if ($stat == Password::RESET_LINK_SENT) {
            return ApiResponse::success(null, __($stat));
        }

        return ApiResponse::fail(__($stat), 'reset_link_failed', 422);
    }

    // ResetPass
    public function resetPassword(ResetPasswordRequest $request)
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
    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = auth('api')->user();
        $data = $request->validated();

        if ($request->hasFile('profile_image')) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }

            $data['profile_image'] = $request->file('profile_image')
                ->store('profile-images', 'public');
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

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return ApiResponse::success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile_image' => $user->profile_image
                    ? Storage::disk('public')->url($user->profile_image)
                    : null,
                'roles' => $user->getRoleNames(),
            ],
        ], $emailChanged
            ? 'Profile updated successfully. A verification link was sent to your new email address.'
            : 'Profile updated successfully.');
    }
}
