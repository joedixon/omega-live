import type { Stats } from '@/types';

export function StatsPanel({
    stats,
    roundTrip,
    reactions,
}: {
    stats: Stats;
    roundTrip: number | null;
    reactions: number;
}) {
    const tiles = [
        {
            label: 'Open connections',
            value: stats.connections ?? '—',
            hint: 'from Reverb’s HTTP API',
        },
        {
            label: 'Shoutouts',
            value: stats.shoutouts,
            hint: 'broadcast by Laravel',
        },
        {
            label: 'Reactions seen',
            value: reactions,
            hint: 'browser to browser',
        },
        {
            label: 'Your round trip',
            value: roundTrip === null ? '—' : `${roundTrip} ms`,
            hint: 'post → broadcast → you',
        },
    ];

    return (
        <dl className="grid grid-cols-2 gap-2.5">
            {tiles.map((tile) => (
                <div
                    key={tile.label}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4"
                >
                    <dt className="text-xs text-white/45">{tile.label}</dt>
                    <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                        {tile.value}
                    </dd>
                    <dd className="mt-0.5 text-[11px] text-white/30">
                        {tile.hint}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
