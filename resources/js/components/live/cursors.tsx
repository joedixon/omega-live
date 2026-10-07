import type { Member } from '@/types';

export type Cursor = {
    x: number;
    y: number;
    seen: number;
};

export function Cursors({
    cursors,
    members,
}: {
    cursors: Record<number, Cursor>;
    members: Member[];
}) {
    const people = new Map(members.map((member) => [member.id, member]));

    return (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
            {Object.entries(cursors).map(([id, cursor]) => {
                const member = people.get(Number(id));

                if (!member) {
                    return null;
                }

                return (
                    <div
                        key={id}
                        className="absolute top-0 left-0 [translate:var(--cursor)] transition-[translate] duration-100 ease-linear will-change-[translate]"
                        style={
                            {
                                '--cursor': `calc(${cursor.x} * 100vw) calc(${cursor.y} * 100vh)`,
                            } as React.CSSProperties
                        }
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            className="drop-shadow-[0_1px_2px_rgb(0_0_0/0.25)]"
                        >
                            <path
                                d="M4 2.5 20 11l-7.2 1.8L9 20 4 2.5Z"
                                fill={member.color}
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div
                            className="ml-4 -translate-y-1 rounded-full py-0.5 pr-2 pl-2 text-xs/5 font-medium whitespace-nowrap text-white shadow-md ring-1 ring-black/5"
                            style={{ backgroundColor: member.color }}
                        >
                            {member.name}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
