export type Member = {
    id: number;
    name: string;
    color: string;
};

export type Shoutout = {
    id: number;
    body: string;
    name: string;
    color: string;
    at: string | null;
};

export type ShoutoutPosted = Shoutout & {
    nonce: string | null;
};

export type Stats = {
    connections: number | null;
    members: number | null;
    shoutouts: number;
    online: boolean;
};

/** Whispered by each visitor as their pointer moves, as fractions of the viewport. */
export type CursorWhisper = {
    id: number;
    x: number;
    y: number;
    hidden?: boolean;
};

export type ReactionWhisper = {
    id: number;
    emoji: string;
    x: number;
};
