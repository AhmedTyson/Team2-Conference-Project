<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Models\Role;
use App\Models\User;
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

        return response()->json([
            'message' => 'user created',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'phone' => $user->phone,
            ],
        ], 201);
    }

    // Verify email & login
    public function login(LoginRequest $request)
    {
        $credentials = $request->only('email', 'password');
        $user = User::where('email', $request->email)->first();
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

        return response()->json([
            'message' => 'user logged in successfully',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),

            ],
        ]);
    }

    // Profile
    public function me()
    {
        $user = auth('api')->user();

        return response()->json([
            'success' => true,
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
            return response()->json([
                'message' => 'Invalid verification link',
            ], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified',
            ]);
        }

        $user->markEmailAsVerified();

        event(new Verified($user));

        return response()->json([
            'message' => 'Email verified successfully',
        ]);
    }

    // Resend the verification email
    public function resendVerificationEmail(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Email already verified.',
            ], 200);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json([
            'success' => true,
            'message' => 'Verification link sent successfully.',
        ], 200);
    }

    // LOGOUT
    public function logout()
    {
        auth('api')->logout();

        return response()->json([
            'message' => 'User Logged out Successfully',
        ]);
    }

    // Refresh
    public function refresh()
    {
        $token = auth('api')->refresh();

        return response()->json([
            'token' => $token,
        ]);
    }

    // ForgetPass
    public function forgetPassword(ForgotPasswordRequest $request)
    {
        $stat = Password::sendResetLink($request->only('email'));

        if ($stat == Password::RESET_LINK_SENT) {
            return response()->json(['message' => __($stat)]);
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
            return response()->json([
                'message' => 'Passwrod reset successfully',
            ], 200);
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

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile_image' => $user->profile_image
                    ? Storage::disk('public')->url($user->profile_image)
                    : null,
                'roles' => $user->getRoleNames(),
            ],
        ], 200);
    }
}
