<?php

namespace App\Http\Controllers;

use App\Models\Transfert;
use App\Models\Courrier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TransfertController extends Controller
{
public function courriersRecus()
{
    $user = auth()->user();

    return Transfert::with(['courrier.service', 'expediteur', 'destinataire'])
        ->whereHas('destinataire', fn($q) => $q->where('id', $user->id))
        ->get()
        ->map(function ($transfert) {
            return [
                'id' => $transfert->id,
                'transfert_id' => $transfert->id,
                'service_expediteur' => $transfert->courrier->service->nom ?? 'Inconnu',
                'expediteur' => $transfert->expediteur->name ?? 'Inconnu',
                'destinataire' => $transfert->destinataire->name,
                'objet' => $transfert->courrier->objet ?? 'Sans objet',
                'date_reception' => $transfert->created_at->format('Y-m-d H:i:s'),
                'statut' => $transfert->statut,
                'commentaire' => $transfert->commentaire ?? $transfert->courrier->commentaire ?? '', // Priorité au commentaire du transfert
                'fichier' => $transfert->courrier->fichier ?? null,
                'courrier_id' => $transfert->courrier->id
            ];
        });
}

public function confirmerReception(Request $request, $id)
{
    $request->validate([
        'signature' => 'required|string'
    ]);

    $transfert = Transfert::findOrFail($id);

    if ($transfert->destinataire_id !== auth()->id()) {
        abort(403, 'Action non autorisée');
    }

    $transfert->update([
        'statut' => 'lu',
        'accuse_reception' => true,
        'date_accuse' => now(),
        'signature' => $request->signature
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Réception confirmée avec signature',
        'statut' => $transfert->statut,
        'date_accuse' => $transfert->date_accuse,
        'signature' => $transfert->signature
    ]);
}public function marquerTraite($id)
{
    try {
        $transfert = Transfert::findOrFail($id);

        if ($transfert->expediteur_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée'
            ], 403);
        }

        DB::beginTransaction();
        $transfert->update(['statut' => 'traite']);

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Courrier marqué comme traité',
            'statut' => 'traite'
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Erreur serveur: ' . $e->getMessage()
        ], 500);
    }
}


public function courriersEnvoyes()
{
    $user = auth()->user();

    if (!$user) {
        return response()->json(['error' => 'Non authentifié'], 401);
    }

    $transferts = Transfert::with(['courrier', 'destinataire.service', 'expediteur'])
        ->where('expediteur_id', $user->id)
        ->get()
        ->map(function ($transfert) {
            return [

    'id' => $transfert->id,
    'transfert_id' => $transfert->id,
    'reference' => $transfert->courrier->reference ?? 'N/A',
    'service_destinataire' => $transfert->destinataire->service->nom ?? 'Inconnu',
    'expediteur' => $transfert->expediteur->name ?? 'Inconnu',
    'destinataire' => $transfert->destinataire->name ?? 'Inconnu',
    'objet' => $transfert->courrier->objet ?? 'Sans objet',
    'date_envoi' => $transfert->created_at->format('Y-m-d H:i:s'),
    'statut' => $transfert->statut,
    'contenu' => $transfert->commentaire ?? '',
    'fichier' => $transfert->courrier->fichier ?? null,
    'courrier_id' => $transfert->courrier->id ?? $transfert->id,
];


        });

    return response()->json($transferts);
}


    public function historique(Request $request)
    {
        $user = $request->user();

        return $user->transfertsRecus()
            ->with(['courrier', 'expediteur'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);
    }




    public function store(Request $request)
{

    try {
        $transfert = Transfert::create([
            'courrier_id' => $request->courrier_id,
            'expediteur_id' =>$request->expediteur_id,
            'destinataire_id' => $request->destinataire_id,
            'statut' => $request->statut,

        ]);

        return response()->json([
            'success' => true,
            'data' => $transfert,
            'message' => 'Transfert créé avec succès'
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la création du transfert',
            'error' => $e->getMessage()
        ], 500);
    }
}
public function courriersSignes()
{
    $user = auth()->user();

    return Transfert::with(['courrier.service', 'expediteur', 'destinataire'])
        ->where('statut', 'lu')
        ->whereHas('courrier', function($q) use ($user) {
            $q->where('service_id', $user->service_id);
        })
        ->get()
        ->map(function ($transfert) {
            return [
                'id' => $transfert->id,
                'transfert_id' => $transfert->id,
                'reference' => $transfert->courrier->reference ?? 'N/A',
                'service_expediteur' => $transfert->courrier->service->nom ?? 'Inconnu',
                'expediteur' => $transfert->expediteur->name ?? 'Inconnu',
                'destinataire' => $transfert->destinataire->name,
                'objet' => $transfert->courrier->objet ?? 'Sans objet',
                'date_reception' => $transfert->created_at->format('Y-m-d H:i:s'),
                'statut' => $transfert->statut,
                'signature' => $transfert->signature,
                'contenu' => $transfert->courrier->contenu ?? ''
            ];
        });
}

public function courriersSignesExpediteur($userId)
{
    return Transfert::with(['courrier.service', 'expediteur', 'destinataire'])
        ->where('statut', 'lu')
        ->where('expediteur_id', $userId)
        ->whereNotNull('signature')
        ->get()
        ->map(function ($transfert) {
            return [
                'id' => $transfert->id,
                'transfert_id' => $transfert->id,
                'reference' => $transfert->courrier->reference ?? 'N/A',
                'service_expediteur' => $transfert->courrier->service->nom ?? 'Inconnu',
                'expediteur' => $transfert->expediteur->name ?? 'Inconnu',
                'destinataire' => $transfert->destinataire->name,
                'objet' => $transfert->courrier->objet ?? 'Sans objet',
                'date_reception' => $transfert->created_at->format('Y-m-d H:i:s'),
                'statut' => $transfert->statut,
                'signature' => $transfert->signature,
                'contenu' => $transfert->courrier->contenu ?? ''
            ];
        });
}
public function mesCourriersSignes()
{
    $userId = auth()->id();

    return Transfert::with(['courrier.service', 'expediteur', 'destinataire'])
        ->where('expediteur_id', $userId)
        ->whereNotNull('signature')
        ->where('statut', '!=', 'traite')
        ->get()
        ->map(function ($transfert) {
            return [
                'id' => $transfert->id,
                'transfert_id' => $transfert->id,
                'reference' => $transfert->courrier->reference ?? 'N/A',
                'service_destinataire' => $transfert->destinataire->service->nom ?? 'Inconnu',
                'destinataire' => $transfert->destinataire->name,
                'objet' => $transfert->courrier->objet ?? 'Sans objet',
                'date_envoi' => $transfert->created_at->format('Y-m-d H:i:s'),
                'statut' => $transfert->statut,
                'signature' => $transfert->signature,
                'contenu' => $transfert->courrier->contenu ?? '',
                'can_mark_treated' => $transfert->expediteur_id === auth()->id()
            ];
        });
}






   public function recupererBrouillons($id)
    {

        $courriersAvecTransferts = Transfert::select('courrier_id')->distinct()->pluck('courrier_id');

        $brouillons = Courrier::with(['service'])
            ->where('expediteur_id', $id)
            ->whereNotIn('id', $courriersAvecTransferts)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $brouillons
        ]);
    }

    public function destroy($id)
{
    $transfert = Transfert::findOrFail($id);

    if ($transfert->statut !== 'traite') {
        return response()->json([
            'success' => false,
            'message' => 'Seuls les courriers traités peuvent être supprimés'
        ], 403);
    }

    $transfert->delete();

    return response()->json([
        'success' => true,
        'message' => 'Courrier supprimé avec succès'
    ]);
}
}
