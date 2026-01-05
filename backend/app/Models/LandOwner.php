<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandOwner extends Model
{
    protected $fillable = [
        'owner_name',
        'mobile_number',
        'address',
        'notes',
        'zone_id',
        'created_by',
    ];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function poles()
    {
        return $this->hasMany(Pole::class);
    }
}
