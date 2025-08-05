<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('courriers', function (Blueprint $table) {
        $table->engine = 'InnoDB';
        $table->id();
        $table->string('objet');
        $table->enum('type', ['entrant', 'sortant']);
        $table->date('date_reception');
        $table->string('fichier');
        $table->string('expediteur_externe')->nullable();
        $table->foreignId('service_id')->nullable()->constrained('services');
        $table->unsignedBigInteger('expediteur_id')->nullable();
        $table->foreign('expediteur_id')->references('id')->on('users')->onDelete('set null');

        $table->boolean('urgent')->default(false);

        $table->text('commentaire')->nullable();
        $table->timestamps();
    });

    }

    public function down(): void
    {
        Schema::dropIfExists('courriers');
    }
};
