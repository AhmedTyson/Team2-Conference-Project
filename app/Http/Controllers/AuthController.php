<?php

namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Verified;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
class AuthController extends Controller
{
 
   
    //Register a new user 
    public function register(Request $request)
    {
         
           
            $role = Role::where('name', 'user')->firstOrFail();

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password,
                'phone' => $request->phone,
            ]);

            $user->assignRole($role);
            $user->sendEmailVerificationNotification();

            $token = auth('api')->login($user);
        

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
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');
        $token = auth('api')->attempt($credentials);

        if (! $token) {
            return response()->json([
                'message' => 'Invalid email or password',
            ], 401);
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
    
    
    //verfication notifaction
    public function verificationNotice()
    {
        return response()->json([
            'success' => false,
            'message' => 'Please verify your email address.',
        ], 403);
    }
    
    
    //verify Email
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
    
    
    //Resend the verification email 
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
    
    
    //LOGOUT
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
            'token'=> $token
        ]);
    }

    // ForgetPass
    public function forgetPassword(Request $request)
    {
        $request->validate([
            'email'=>['required', 'email', 'exists:users,email']
        ]);

        $stat = Password::sendResetLink($request->only('email'));

        if($stat == Password::RESET_LINK_SENT){
            return response()->json(["message" => __($stat)]);
        }
        return response()->json(["message" => __($stat)], 422);
    }

    // ResetPass
    public function resetPassword(Request $request){
        $request->validate([
            'email' => 'required|email',
            'token' => 'required',
            'password' => 'required|confirmed|min:8'
        ]);

        $stat = Password::reset(
            $request->only(
                'email',
                'password',
                'password_confirmation',
                'token'
            ),
            function (User $user, string $password) {
                $user->update([
                    'password' => Hash::make($password)
                ]);
            }
        );

        if($stat == Password::PASSWORD_RESET){
            return response()->json([
                'message'=> "Passwrod reset successfully"
            ], 200);
        }

        return response()->json([
            'message' => $stat
        ], 422);

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
