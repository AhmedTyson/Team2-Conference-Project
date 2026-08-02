<?php

namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;

class AuthController extends Controller
{
 
   
    //Register a new user 
    public function register(Request $request)
    {
        try {
           
            $role = Role::where('name', 'LIKE', '%user%')->firstOrFail();

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password,
                'role_id' => $role->id,
            ]);

            $token = auth('api')->login($user);
        } catch (Exception $ex) {
            return response()->json(['exception' => $ex->getMessage()]);
        }

        return response()->json([
            'message' => 'user created',
            'token' => $token,
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

        return response()->json([
            'message' => 'user logged in successfully',
            'token' => $token,
        ]);
    }
    
    // Return
    public function me()
    {
        $user = auth('api')->user();

        return response()->json([
            'success' => true,
            'user' => $user,
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


    public function refresh()
    {
        $token = auth('api')->refresh();
        return response()->json([
            'token'=> $token
        ]);
    }

    // public function forgetPassword(Request $request)
    // {
    //     $request->validate([
    //         'email'=>['required', 'email', 'exists:users,email']
    //     ]);

    //     $status = Password::sendResetLink();
    // }
}
