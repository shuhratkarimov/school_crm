import { BASE_ORIGIN } from "../conf/api";

export async function getShouldShowPlatformReview() {
    const res = await fetch(`${BASE_ORIGIN}/platform-review/should-show`, {
        method: 'GET',
        credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.message || 'Platform review holatini olishda xatolik');
    }

    return data;
}

export async function submitPlatformReview(payload) {
    const safePayload = {
        rating: Number(payload.rating),
        comment: typeof payload.comment === 'string' ? payload.comment : '',
    };

    const res = await fetch(`${BASE_ORIGIN}/platform-review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(safePayload),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.message || 'Review yuborishda xatolik');
    }

    return data;
}

export async function dismissPlatformReview() {
    const res = await fetch(`${BASE_ORIGIN}/platform-review/dismiss`, {
        method: 'POST',
        credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.message || 'Review oynasini yopishda xatolik');
    }

    return data;
}