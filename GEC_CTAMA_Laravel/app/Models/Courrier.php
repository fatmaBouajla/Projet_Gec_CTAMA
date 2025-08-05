<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Transfert;

class Courrier extends Model
{


    protected $guarded = [];

protected $casts = [
    'urgent' => 'boolean',
    'accuse_reception' => 'boolean'
];

    public function expediteur()
    {
        return $this->belongsTo(User::class, 'expediteur_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function transferts()
    {
        return $this->hasMany(Transfert::class);
    }

}

