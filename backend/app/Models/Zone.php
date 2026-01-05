<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Zone extends Model
{
    protected $fillable = [
        'zone_name',
        'zone_boundary',
        'description',
        'status',
        'created_by',
    ];

    protected $casts = [
        'zone_boundary' => 'array',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function poles()
    {
        return $this->hasMany(Pole::class);
    }

    public function landOwners()
    {
        return $this->hasMany(LandOwner::class);
    }
}
