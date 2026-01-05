<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pole extends Model
{
    protected $fillable = [
        'pole_name',
        'latitude',
        'longitude',
        'pole_height',
        'restricted_radius',
        'status',
        'zone_id',
        'land_owner_id',
        'created_by',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'pole_height' => 'decimal:2',
        'restricted_radius' => 'decimal:2',
    ];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function landOwner()
    {
        return $this->belongsTo(LandOwner::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lineOfSightCalculations()
    {
        return $this->hasMany(LineOfSightCalculation::class);
    }
}
