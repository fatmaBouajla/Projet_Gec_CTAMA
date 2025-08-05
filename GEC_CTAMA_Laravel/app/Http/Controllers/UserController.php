<?php

namespace App\Http\Controllers;
use App\Models\User;
use App\Models\Service;
use App\Notifications\ForgetPassword;
use App\Notifications\VerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{


    public function index()
    {
        $users = User::with('service')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'service' => $user->service ? ['id' => $user->service->id, 'nom' => $user->service->nom] : null,
                'role' => $user->role,
                 'position' => $user->position,
            ];
        });
        return response()->json($users, 200);
    }





    public function show(int $id)
    {
        $user = User::where('id', $id)->first();
        return response()->json($user, 200);
    }





    public function destroy(int $id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'user deleted']);
    }




    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'position' => 'required|string',
            'service_nom' => 'required|string|exists:services,nom'
        ]);

        $service = Service::where('nom', $request->service_nom)->first();

        $user = User::create([
            "name" => $request->name,
            "email" => $request->email,
            "password" => bcrypt($request->password),
            "position" => $request->position,
            "service_id" => $service->id
        ]);

        $user->notify(new VerifyEmail());

        return response()->json([
            'message' => 'User Registered Successfully',
            'user' => $user
        ], 201);
    }







    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string',
        ]);

        if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            $user = Auth::user();
            if (!$user->hasVerifiedEmail()) {
                return response()->json(['data' => "Your email is not verified", 'status' => "email"], 404);
            }
            $token = $user->createToken('auth_token')->plainTextToken;
            $responseData = [
                'user' => $user,
                'token' => $token,
            ];

            return response()->json([
                'data' => $responseData,
                'message' => 'Login successful',
            ], 200);
        } else {
            return response()->json(['message' => 'email or password invalid'], 404);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'logout successfully']);
    }





    public function verifieremail(string $email)
    {
        $user = User::where('email', $email)->first();
        if ($user) {
            if (!$user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
                return response()->json(['message' => 'email verified'], 200);
            } else {
                return response()->json(['message' => 'email already verified'], 200);
            }
        } else {
            return response()->json(['message' => 'email not found'], 404);
        }
    }






    public function ForgetPassword(string $email)
    {
        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json(['error' => 'Aucun compte associé à cette adresse email.'], 404);
        }
        $token = mt_rand(100000, 999999);
        $user->password_token = $token;
        $user->password_token_send_at = now();
        $user->save();
        $user->notify(new ForgetPassword($token));
        return response()->json(["data" => "Code Send To Your Email successfully"], 200);
    }

    public function verifyResetCode(Request $request)
{
    try {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|numeric'
        ]);

        $user = User::where('email', $request->email)
                   ->where('password_token', $request->code)
                   ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Code invalide ou email incorrect'
            ], 401);
        }

        if ($user->password_token_send_at < now()->subHour()) {
            return response()->json([
                'success' => false,
                'message' => 'Le code a expiré'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Code vérifié avec succès',
            'token' => $user->createToken('password-reset')->plainTextToken
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la vérification: ' . $e->getMessage()
        ], 500);
    }
}

public function update(Request $request, $id)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email,'.$id,
        'position' => 'required|string|max:255',
        'service' => 'required|string|exists:services,nom',
        'role' => 'required|string|in:user,admin'
    ]);

    $service = Service::where('nom', $request->service)->firstOrFail();
    $user = User::findOrFail($id);

    $user->update([
        'name' => $request->name,
        'email' => $request->email,
        'position' => $request->position,
        'service_id' => $service->id,
        'role' => $request->role
    ]);

    return response()->json([
        'message' => 'Utilisateur mis à jour avec succès',
        'user' => $user
    ]);
}



  public function ChangerPassword(Request $request)
{
    try {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed'
        ]);


        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(["data" => "Email invalide"], 404);
        }

        $user->update([
            'password' => bcrypt($request->password),
            'password_token' => null,
            'password_token_send_at' => null
        ]);


        $user->tokens()->delete();

        return response()->json(["data" => "Password Changed With success"], 200);

    } catch (\Exception $e) {
        return response()->json(["data" => "Erreur serveur: ".$e->getMessage()], 500);
    }
}











    public function getCurrentUser(Request $request)
    {
        return response()->json([
            'name' => $request->user()->name,
            'position' => $request->user()->position,
            'email' => $request->user()->email
        ]);
    }


public function storeByAdmin(Request $request)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'position' => 'required|string|max:255',
        'service_nom' => 'required|string|exists:services,nom',
        'role' => 'required|string|in:user,admin',
       'password' => 'required|string|min:8|confirmed'
    ]);

    $service = Service::where('nom', $request->service_nom)->firstOrFail();
    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        "password" => bcrypt($request->password),
        'position' => $request->position,
        'service_id' => $service->id,
        'role' => $request->role,
        'email_verified_at' => now()

    ]);



    return response()->json([
        'message' => 'Utilisateur créé avec succès',
        'user' => $user,

    ], 201);
}


}

