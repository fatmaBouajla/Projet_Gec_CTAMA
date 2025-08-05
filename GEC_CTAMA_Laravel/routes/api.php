<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\CourrierController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TransfertController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::post('register', [UserController::class, 'register']);
Route::post('login', [UserController::class, 'login']);
Route::get("verifemail/{email}", [UserController::class, 'verifieremail']);
Route::get("ForgetPassword/{email}", [UserController::class, 'ForgetPassword']);
Route::post('/resend-code', [UserController::class, 'ForgetPassword']);
Route::post('verify-reset-code', [UserController::class, 'verifyResetCode']);
Route::get('/services', [ServiceController::class, 'index']);


Route::get('/public/courriers/{id}', [CourrierController::class, 'show']);
Route::get('/public/courriers/{id}/download', [CourrierController::class, 'telechargerFichier']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('ChangerPassword', [UserController::class, 'ChangerPassword']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/current-user', [UserController::class, 'getCurrentUser']);
    Route::get('/users', [UserController::class, 'index']);


    Route::post('/admin/users', [UserController::class, 'storeByAdmin']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);


    Route::post('logout', [UserController::class, 'logout']);


    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{id}', [ServiceController::class, 'update']);
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);




    Route::prefix('courriers')->group(function () {
        Route::get('/', [CourrierController::class, 'index']);
         Route::post('/', [CourrierController::class, 'store']);
        Route::put('/{id}', [CourrierController::class, 'update']);
        Route::delete('/{id}', [CourrierController::class, 'destroy']);

        Route::post('/{id}/mark-as-read', [CourrierController::class, 'markAsRead']);
        Route::post('/{id}/mark-as-favoris', [CourrierController::class, 'markAsFavoris']);
        Route::post('/{id}/mark-as-traite', [CourrierController::class, 'markAsTraite']);


    });


    Route::get('/transferts/courriers-recus', [TransfertController::class, 'courriersRecus']);
    Route::put('/transferts/{id}/marquer-traite', [TransfertController::class, 'marquerTraite']);
    Route::delete('/transferts/{id}', [TransfertController::class, 'destroy']);

    Route::post('/transferts/{id}/confirmer', [TransfertController::class, 'confirmerReception']);
    Route::get('/transferts/courriers-envoyes', [TransfertController::class, 'courriersEnvoyes']);
    Route::get('/transferts/courriers-signes', [TransfertController::class, 'courriersSignes']);
     Route::get('/transferts/courriers-signes-expediteur/{userId}', [TransfertController::class, 'courriersSignesExpediteur']);


});
Route::get('/transferts/mes-courriers-signes', [TransfertController::class, 'mesCourriersSignes'])
    ->middleware('auth:sanctum');
Route::put('/transferts/{transfert}/marquer-traite', [TransfertController::class, 'marquerTraite'])
    ->middleware('auth:sanctum');






Route::middleware('auth:sanctum')->group(function () {

    Route::get('/transferts', [TransfertController::class, 'index']);
});

Route::post('/transferts', [TransfertController::class, 'store']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});




    Route::get('/services/{service}/users', [ServiceController::class, 'selectusers']);


Route::get('/brouillons/{id}', [TransfertController::class, 'recupererBrouillons']);

Route::get('/courriers/{id}/telecharger', [CourrierController::class, 'telechargerFichier']);
