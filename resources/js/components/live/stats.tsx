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
    const items = [
        {
            label: 'Open connections',
            value: stats.connections ?? '–',
            hint: 'From Reverb’s HTTP API',
        },
        {
            label: 'Shoutouts',
            value: stats.shoutouts,
            hint: 'Broadcast by Laravel',
        },
        {
            label: 'Reactions seen',
            value: reactions,
            hint: 'Browser to browser',
        },
        {
            label: 'Your round trip',
            value: roundTrip === null ? '–' : `${roundTrip} ms`,
            hint: 'Post, broadcast, receive',
        },
    ];

    return (
        <dl className="grid grid-cols-2 sm:grid-cols-4">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="border-t border-zinc-950/10 py-5 max-sm:odd:pr-4 max-sm:even:border-l max-sm:even:pl-4 sm:px-4 sm:not-first:border-l sm:first:pl-0 sm:last:pr-0"
                >
                    <dt className="text-sm/6 font-medium text-zinc-950">
                        {item.label}
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 tabular-nums">
                        {item.value}
                    </dd>
                    <dd className="mt-1 text-sm/5 text-zinc-500">
                        {item.hint}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
