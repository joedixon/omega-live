<?php

namespace App\Http\Controllers;

use App\Events\ShoutoutPosted;
use App\Http\Requests\StoreShoutoutRequest;
use App\Models\Shoutout;
use App\Support\ReverbStats;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WallController extends Controller
{
    public function show(Request $request, ReverbStats $stats): Response
    {
        return Inertia::render('live', [
            'me' => $request->user()->toPresence(),
            'shoutouts' => Shoutout::with('user')->latest('id')->limit(30)->get()->map->toWall(),
            'stats' => fn () => $stats->snapshot(),
            'reverbHost' => config('broadcasting.connections.reverb.options.host'),
        ]);
    }

    public function store(StoreShoutoutRequest $request): RedirectResponse
    {
        $shoutout = $request->user()->shoutouts()->create($request->safe()->only('body'));

        ShoutoutPosted::dispatch($shoutout->load('user'), $request->validated('nonce'));

        return back();
    }
}
