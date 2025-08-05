<?php

namespace App\Models;
use App\Models\Courrier;
use App\Models\Transfert;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $guarded = [];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relation avec le service
    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    // RELATIONS AVEC LA TABLE TRANSFERTS (Nouvelles relations)

    // Transferts où l'utilisateur est l'expéditeur
    public function transfertsEnvoyes()
    {
        return $this->hasMany(Transfert::class, 'expediteur_id');
    }

    // Transferts où l'utilisateur est le destinataire
    public function transfertsRecus()
    {
        return $this->hasMany(Transfert::class, 'destinataire_id');
    }

    // Courriers envoyés (via la table courriers)
    public function courriersEnvoyes()
    {
        return $this->hasMany(Courrier::class, 'expediteur_id');
    }

    // Courriers reçus via les transferts (relation hasManyThrough)
    public function courriersRecus()
    {
        return $this->hasManyThrough(
            Courrier::class,
            Transfert::class,
            'destinataire_id', // Clé étrangère sur transferts
            'id', // Clé locale sur courriers
            'id', // Clé locale sur users
            'courrier_id' // Clé étrangère sur transferts
        )->with('expediteur');
    }


}
