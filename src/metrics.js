export function repeat(a, b) {
    return a.p == b.p
}

export function same_finger(a, b) {
    return (
        a.p != b.p &&
        a.f == b.f
    )
}

export function lateral_stretch(a, b) {
    return (
        a.h == b.h &&
        Math.abs(a.f - b.f) == 1 &&
        Math.abs(a.x - b.x) >= 2
    )
}

export function half_scissor(a, b) {
    return (
        a.h == b.h &&
        a.f != b.f &&
        Math.abs(a.y - b.y) == 1 &&
        [1, 2, 7, 8].includes((a.y > b.y ? a : b).f)
    )
}

export function full_scissor(a, b) {
    return (
        a.h == b.h &&
        a.f != b.f &&
        Math.abs(a.y - b.y) >= 2 &&
        ![3, 4, 5, 6].includes((a.y > b.y ? a : b).f)
    )
}

export function redirect(a, b, c) {
    return (
        a.h == b.h && b.h == c.h &&
        a.f != b.f && b.f != c.f &&
        a.f < b.f != b.f < c.f
    )
}

export function onehand(a, b, c) {
    return (
        a.h == b.h && b.h == c.h &&
        a.f != b.f && b.f != c.f && 
        a.f < b.f == b.f < c.f
    )
}

export function roll(a, b, c) {
    return (
        a.h != c.h &&
        a.f != b.f && b.f != c.f
    )
}

export function inroll(a, b, c) {
    return (
        roll(a, b, c) &&
        (a.h == b.h ? a.f > b.f : c.f < b.f) == b.h
    )
}

export function outroll(a, b, c) {
    return (
        roll(a, b, c) &&
        (a.h == b.h ? a.f > b.f : c.f < b.f) != b.h
    )
}

export function alternate(a, b, c) {
    return a.h != b.h && b.h != c.h
}