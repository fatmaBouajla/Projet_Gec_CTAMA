<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['nom'];

    public function courrier()
    {
        return $this->hasMany(Courrier::class);
    }
    public function user()
{
    return $this->hasMany(User::class);
}
public function users()
{
    return $this->hasMany(User::class, 'service_id');
}
}
