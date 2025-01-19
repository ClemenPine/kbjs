import {Pos} from "./kb.js"

export function repeat(a: Pos, b: Pos) {
    return a.p == b.p
}

export function same_finger(a: Pos, b: Pos) {
    return (
        a.p != b.p &&
        a.f == b.f
    )
}

export function lateral_stretch(a: Pos, b: Pos) {
    return (
        a.h == b.h &&
        Math.abs(a.f - b.f) == 1 &&
        Math.abs(a.x - b.x) >= 2
    )
}

export function half_scissor(a: Pos, b: Pos) {
    return (
        a.h == b.h &&
        a.f != b.f &&
        Math.abs(a.y - b.y) == 1 &&
        [1, 2, 7, 8].includes((a.y > b.y ? a : b).f)
    )
}

export function full_scissor(a: Pos, b: Pos) {
    return (
        a.h == b.h &&
        a.f != b.f &&
        Math.abs(a.y - b.y) >= 2 &&
        ![3, 4, 5, 6].includes((a.y > b.y ? a : b).f)
    )
}

export function redirect(a: Pos, b: Pos, c: Pos) {
    return (
        a.h == b.h && b.h == c.h &&
        a.f != b.f && b.f != c.f &&
        a.f < b.f != b.f < c.f
    )
}

export function onehand(a: Pos, b: Pos, c: Pos) {
    return (
        a.h == b.h && b.h == c.h &&
        a.f != b.f && b.f != c.f && 
        a.f < b.f == b.f < c.f
    )
}

export function roll(a: Pos, b: Pos, c: Pos) {
    return (
        a.h != c.h &&
        a.f != b.f && b.f != c.f
    )
}

export function inroll(a: Pos, b: Pos, c: Pos) {
    return (
        roll(a, b, c) &&
        Number(a.h == b.h ? a.f > b.f : c.f < b.f) == b.h
    )
}

export function outroll(a: Pos, b: Pos, c: Pos) {
    return (
        roll(a, b, c) &&
        Number(a.h == b.h ? a.f > b.f : c.f < b.f) != b.h
    )
}

export function alternate(a: Pos, b: Pos, c: Pos) {
    return a.h != b.h && b.h != c.h
}