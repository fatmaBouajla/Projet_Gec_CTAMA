<?php

namespace App\Http\Controllers;

use App\Models\Courrier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class CourrierController extends Controller
{
    public function index(Request $request)
    {
        return Courrier::with([
            'expediteur' => function ($query) {
                $query->select('id', 'name');
            }
        ])
            ->where('expediteur_id', $request->user()->id)
            ->get();
    }

    public function store(Request $request)
    {
        try {
            $filePath = null;
            if ($request->hasFile('fichier')) {
                $file = $request->file('fichier');
                $fileName = time().'_'.preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
                $path = $file->storeAs('private/public_courriers', $fileName);
                $filePath = 'private/public_courriers/'.$fileName;
            }

            $courrier = Courrier::create([
                'objet' => $request->objet,
                'type' => $request->type,
                'date_reception' => $request->date_reception,
                'fichier' => $filePath,
                'expediteur_externe' => $request->expediteur_externe,
                'service_id' => $request->service_id,
                'expediteur_id' => Auth()->id(),
                'urgent' => $request->boolean('urgent'),
                'commentaire' => $request->commentaire,
            ]);

            return response()->json([
                'success' => true,
                'data' => $courrier,
                'message' => 'Courrier créé avec succès'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur création courrier: '.$e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: '.$e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $courrier = Courrier::findOrFail($id);
            $validated = $request->validate([
                'objet' => 'sometimes|string|max:255',
                'type' => 'sometimes|in:entrant,sortant',
                'date_reception' => 'sometimes|date',
                'fichier' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'service_id' => 'sometimes|exists:services,id',
                'urgent' => 'sometimes|boolean',
                'commentaire' => 'nullable|string',
            ]);

            if ($request->hasFile('fichier')) {
                Storage::delete($courrier->fichier);
                $path = $request->file('fichier')->store('private/public_courriers');
                $validated['fichier'] = $path;
            }

            $courrier->update($validated);
            return response()->json($courrier);

        } catch (\Exception $e) {
            Log::error("Erreur mise à jour courrier: " . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $courrier = Courrier::findOrFail($id);
            Storage::delete($courrier->fichier);
            $courrier->delete();
            return response()->json(['message' => 'Courrier supprimé']);

        } catch (\Exception $e) {
            Log::error("Erreur suppression courrier: " . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la suppression'], 500);
        }
    }

    public function telechargerFichier($id)
    {
        $courrier = Courrier::findOrFail($id);

        if (!Storage::exists($courrier->fichier)) {
            return response()->json([
                'error' => 'Fichier introuvable',
                'path' => $courrier->fichier
            ], 404);
        }

        return Storage::download($courrier->fichier);
    }
}
