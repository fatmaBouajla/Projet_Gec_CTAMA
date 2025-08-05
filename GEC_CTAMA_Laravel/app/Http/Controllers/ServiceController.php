<?php

namespace App\Http\Controllers;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index()
    {
        $services = Service::all();
        return response()->json($services);
    }

    public function store(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
    return response()->json(['message' => 'Accès refusé'], 403);
}
        $request->validate([
            'nom' => 'required|string|max:255',
        ]);

        $service = Service::create([
            'nom' => $request->nom,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service créé avec succès',
            'service' => $service,
        ]);
    }

    public function show($id)
    {
        $service = Service::findOrFail($id);
        return response()->json($service);
    }

    public function update(Request $request, $id)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'Accès refusé'], 403);
        }

        $request->validate([
            'nom' => 'required|string|max:255',
        ]);

        $service = Service::findOrFail($id);
        $service->update([
            'nom' => $request->nom,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service mis à jour',
            'service' => $service,
        ]);
    }

   public function destroy($id)
{
    try {
        $service = Service::findOrFail($id);

    //!!!!!!
        if ($service->users()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer: des utilisateurs sont associés à ce service'
            ], 422);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service supprimé avec succès'
        ]);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Service non trouvé'
        ], 404);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la suppression: '.$e->getMessage()
        ], 500);
    }
}

    public function GetServiceParNom(string $nom)
    {
        $service = Service::where('nom', $nom)->first();

        if (!$service) {
            return response()->json(['message' => 'Service non trouvé'], 404);
        }
        return response()->json($service);
    }




      public function selectusers(string $nomser)
    {
        $service = Service::with('users')->where('nom', $nomser)->first();

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Service non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'users' => $service->users,
            'service' => $service->nom
        ]);
    }
}
