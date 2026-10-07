<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Give every visitor a guest identity, so they can join the presence
 * channel without signing up.
 */
class EnsureGuestIdentity
{
    private const ADJECTIVES = [
        'Swift', 'Brave', 'Cosmic', 'Electric', 'Fuzzy', 'Golden', 'Hyper', 'Jolly',
        'Lunar', 'Mighty', 'Neon', 'Quantum', 'Rapid', 'Sonic', 'Turbo', 'Zesty',
    ];

    private const ANIMALS = [
        'Otter', 'Falcon', 'Panda', 'Fox', 'Koala', 'Lynx', 'Narwhal', 'Octopus',
        'Penguin', 'Quokka', 'Raccoon', 'Sloth', 'Tiger', 'Walrus', 'Yak', 'Crab',
    ];

    private const COLORS = [
        '#f53003', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
        '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            Auth::login(User::create([
                'name' => Arr::random(self::ADJECTIVES).' '.Arr::random(self::ANIMALS),
                'email' => Str::uuid().'@guests.omega-live.test',
                'password' => Str::password(32),
                'color' => Arr::random(self::COLORS),
            ]), remember: true);
        }

        return $next($request);
    }
}
