import { Avatar } from '@/components/live/presence';
import { cn } from '@/lib/utils';
import type { Shoutout } from '@/types';

export function Feed({
    shoutouts,
    fresh,
    now,
}: {
    shoutouts: Shoutout[];
    fresh: Set<number>;
    now: number;
}) {
    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 shadow-zinc-950/5 ring-zinc-950/10">
            <div className="flex items-center justify-between border-b border-zinc-950/5 px-5 py-4">
                <h2 className="text-base/6 font-semibold sm:text-sm/6">
                    Shoutouts
                </h2>
                <p className="flex items-center gap-2 text-sm/6 text-zinc-500">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                        <span className="relative inline-flex size-2 rounded-full bg-brand" />
                    </span>
                    Live
                </p>
            </div>

            {shoutouts.length === 0 ? (
                <p className="px-5 py-12 text-center text-base/7 text-zinc-500 sm:text-sm/6">
                    No shoutouts yet. Say the first thing.
                </p>
            ) : (
                <ul
                    role="list"
                    className="max-h-[36rem] divide-y divide-zinc-950/5 overflow-y-auto"
                >
                    {shoutouts.map((shoutout) => (
                        <li
                            key={shoutout.id}
                            className={cn(
                                'flex gap-3 px-5 py-4 transition-colors duration-[2000ms]',
                                fresh.has(shoutout.id) &&
                                    'animate-slide-in bg-orange-50',
                            )}
                        >
                            <Avatar member={shoutout} className="size-9" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="text-sm/6 font-semibold text-zinc-950">
                                        {shoutout.name}
                                    </p>
                                    <p className="shrink-0 text-xs/6 text-zinc-400 tabular-nums">
                                        {ago(shoutout.at, now)}
                                    </p>
                                </div>
                                <p className="text-base/6 break-words text-zinc-700 sm:text-sm/6">
                                    {shoutout.body}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ago(at: string | null, now: number): string {
    if (!at) {
        return '';
    }

    const seconds = Math.max(0, Math.round((now - Date.parse(at)) / 1000));

    if (seconds < 10) {
        return 'just now';
    }

    if (seconds < 60) {
        return `${seconds}s ago`;
    }

    if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}m ago`;
    }

    if (seconds < 86400) {
        return `${Math.floor(seconds / 3600)}h ago`;
    }

    return `${Math.floor(seconds / 86400)}d ago`;
}
