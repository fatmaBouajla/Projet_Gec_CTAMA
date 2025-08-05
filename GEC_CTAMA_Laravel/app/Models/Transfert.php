<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Courrier;
use App\Models\User;
class Transfert extends Model
{
protected $fillable = [
    'courrier_id',
    'expediteur_id',
    'destinataire_id',
    'statut',
    'accuse_reception',
    'date_accuse',
    'signature'
];


    public function courrier()
    {
        return $this->belongsTo(Courrier::class)->withDefault([
            'reference' => 'TR-'.$this->id,
            'objet' => 'Courrier transféré',
            'contenu' => 'Contenu non disponible'
        ]);
    }
    public function expediteur()
    {
        return $this->belongsTo(User::class, 'expediteur_id');
    }

    public function destinataire()
    {
        return $this->belongsTo(User::class, 'destinataire_id');
    }


}
