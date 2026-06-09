export function slugify(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'card';
}

export async function resolveUniqueSlug(
    base: string,
    isAvailable: (slug: string) => Promise<boolean>
): Promise<string> {
    const root = slugify(base);
    if (await isAvailable(root)) return root;

    for (let i = 2; i < 100; i++) {
        const candidate = `${root}-${i}`;
        if (await isAvailable(candidate)) return candidate;
    }

    return `${root}-${Date.now().toString(36)}`;
}
