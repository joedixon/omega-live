export type User = {
    id: number;
    name: string;
    email: string;
    color: string;
    created_at: string;
    updated_at: string;
};

export type Auth = {
    user: User;
};
