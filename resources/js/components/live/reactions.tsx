import { cn } from '@/lib/utils';

export const EMOJIS = ['🔥', '👏', '🚀', '❤️', '😂', '🤯'] as const;

export type Burst = {
    key: number;
    emoji: string;
    x: number;
    drift: number;
    spin: number;
    size: number;
    color: string;
};

export function Bursts({
    bursts,
    onDone,
}: {
    bursts: Burst[];
    onDone: (key: number) => void;
}) {
    return (
        <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
            {bursts.map((burst) => (
                <span
                    key={burst.key}
                    onAnimationEnd={() => onDone(burst.key)}
                    className="absolute bottom-24 animate-float-up select-none"
                    style={
                        {
                            left: `${burst.x * 100}%`,
                            fontSize: `${burst.size}rem`,
                            '--drift': `${burst.drift}px`,
                            '--spin': `${burst.spin}deg`,
                            filter: `drop-shadow(0 0 18px ${burst.color}aa)`,
                        } as React.CSSProperties
                    }
                >
                    {burst.emoji}
                </span>
            ))}
        </div>
    );
}

export function ReactionBar({
    counts,
    onReact,
}: {
    counts: Record<string, number>;
    onReact: (emoji: string, x: number) => void;
}) {
    return (
        <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
                {EMOJIS.map((emoji, index) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={(event) => {
                            const box =
                                event.currentTarget.getBoundingClientRect();
                            onReact(
                                emoji,
                                (box.left + box.width / 2) / window.innerWidth,
                            );
                        }}
                        className={cn(
                            'group relative flex size-12 items-center justify-center rounded-full text-2xl transition',
                            'hover:-translate-y-1 hover:scale-110 hover:bg-white/10 active:scale-95 sm:size-14 sm:text-3xl',
                        )}
                        aria-label={`React with ${emoji}`}
                    >
                        {emoji}
                        <span className="absolute -top-2 -right-1 min-w-5 rounded-full bg-[#f53003] px-1.5 text-[10px] leading-5 font-semibold text-white tabular-nums empty:hidden">
                            {counts[emoji] ? compact(counts[emoji]) : ''}
                        </span>
                        <kbd className="absolute -bottom-1 hidden font-mono text-[9px] text-white/30 sm:block">
                            {index + 1}
                        </kbd>
                    </button>
                ))}
            </div>
        </div>
    );
}

function compact(count: number): string {
    return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
}
