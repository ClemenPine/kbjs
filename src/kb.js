class Grams {
    constructor() {
        this.grams = {}
        this.total = 0
    }

    add(gram, count = 1) {
        this.grams[gram] = (this.grams[gram] ?? 0) + count
        this.total += count
    }

    top(n = 0) {
        let lBound = n < 0 ? n : 0
        let uBound = n > 0 ? n : this.grams.length
        
        return Object.keys(this.grams)
            .sort((a, b) => this.get(a) < this.get(b))
            .slice(lBound, uBound)
    }

    unshift() {        
        let grams = new Grams()
        for (const [k, v] of Object.entries(this.grams)) {
            let gram = [...k].map(x => Grams.shift(x)).join("")
            grams.add(gram, v)
        }

        return grams
    }

    filter(func) {
        let grams = new Grams()
        for (const [k, v] of Object.entries(this.grams)) {
            if (func(k)) {
                grams.add(k, v)
            }
        }

        return grams
    }

    get(gram) {
        return this.grams[gram] ?? 0
    }

    freq(gram) {
        return this.get(gram) / this.total
    }

    static shift(char) {
        return char.toLowerCase()
    }
}

export class Corpus {
    constructor() {
        this.gramSize = 3
        this.skipSize = 1

        this.gram = []
        this.skip = []
        this.word = new Grams()
    }

    get monogram() {
        return this.gram[0]
    }

    get bigram() {
        return this.gram[1]
    }

    get trigram() {
        return this.gram[2]
    }

    get skipgram() {
        return this.skip[0]
    }

    unshift() {
        let corpus = new Corpus()

        for (const grams of this.gram) {
            corpus.gram.push(grams.unshift())
        }

        for (const skips of this.skip) {
            corpus.skip.push(skips.unshift())
        }

        corpus.word = this.word.unshift()
        return corpus
    }

    contains(letters) {
        let func = (x) => [...x].every(y => letters.includes(y))
        let corpus = new Corpus()
        
        for (const grams of this.gram) {
            corpus.gram.push(grams.filter(func))
        }
        
        for (const skips of this.skip) {
            corpus.skip.push(skips.filter(func))
        }

        corpus.word = this.word.filter(func)
        return corpus
    }

    static fromText(text) {
        let corpus = new Corpus()

        for (let _=0; _ < corpus.gramSize; _++) {
            corpus.gram.push(new Grams())
        }

        for (let _=0; _ < corpus.skipSize; _++) {
            corpus.skip.push(new Grams())
        }

        let wordIndex = 0
        for (let i=0; i < text.length; i++) {
            for (let j=0; j < Math.min(i + 1, corpus.gramSize); j++) {
                corpus.gram[j].add(text.slice(i - j, i + 1))
            }

            for (let j=2; j < Math.min(i + 1, corpus.skipSize + 2); j++) {
                corpus.skip[j - 2].add(text[i - j] + text[i])
            }

            if (/\s/.test(text[i])) {
                let word = text.slice(wordIndex, i)

                if (word) {
                    corpus.word.add(word)
                }

                wordIndex = i + 1
            }
        }

        let word = text.slice(wordIndex)

        if (word) {
            corpus.word.add(word)
        }

        return corpus
    }

    static async load(url) {
        let text = await (await fetch(`corpora/${url}.txt`)).text()
        return Corpus.fromText(text)
    }
}

class Pos {
    constructor(x, y, f, p) {
        this.x = x
        this.y = y
        this.f = f
        this.h = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1][f]
        this.p = p
    }

    toString() {
        return this.p
    }
}

export class Metric {
    constructor(name, func, size) {
        this.name = name
        this.func = func
        this.size = size
    }

    compile(...pos) {
        return this.func(...pos)
    }

    static monogram(name, func) {
        return new Metric(name, func, 1)
    }

    static bigram(name, func) {
        return new Metric(name, func, 2)
    }

    static trigram(name, func) {
        return new Metric(name, func, 3)
    }
}

export class Metrics {
    constructor(...metrics) {
        this.metrics = {}
        this.gram = Array(3).fill(null).map(x => [])

        for (const metric of metrics) {
            this.metrics[metric.name] = metric
            this.gram[metric.size - 1].push(metric)
        }
    } 
    
    get monogram() {
        return this.gram[0]
    }

    get bigram() {
        return this.gram[1]
    }

    get trigram() {
        return this.gram[2]
    }
}

class Motion {
    constructor(...chords) {
        this.chords = chords ?? []
    }

    compile(metrics) {
        return metrics.gram[this.chords.length]
    }

    toString() {
        return this.chords.map(x => x.join(" ")).join(", ")
    }

    static composite(...motion) {
        return new Motion(motion.map(x => x.chords).flat())
    }
}

export class Board {
    constructor(board) {
        this.board = {}

        let index = 0
        for (const [y, row] of Object.entries(board ?? {})) {
            for (const [x, f] of Object.entries(row.split(/\s/))) {
                const pos = new Pos(
                    parseInt(x), 
                    parseInt(y), 
                    parseInt(f), 
                    index
                )

                this.board[pos.p] = pos
                index += 1
            }
        }
    }

    get(idx) {
        return this.board[idx]
    }

    add(pos) {
        this.board[pos.p] = pos
    }

    seq(...pos) {
        return new Motion(pos.map(x => [this.board[x]]))
    }

    chord(...pos) {
        return new Motion([pos.map(x => this.board[x])])
    }

    fromString(string) {
        return new Motion(string.split(", ").map(x => this.board[x.split(" ")]))
    }
}

export class Layout {
    constructor() {
        this.keymap = {}
        this.board = new Board()
    }

    compile(metrics) {        
        let res = [[]]
        let res2 = []
        for (let i=0; i < 2; i++) {
            const item = []

            for (const prefix of res) {
                for (const [k, v] of Object.entries(this.keymap)) {
                    const motions = [...prefix, this.board.fromString(k)]
                    
                    const compiled = Motion.composite(...motions).compile(metrics)
                    
                    if (compiled) {
                        console.log()
                        res2.push([motions, compiled])
                        // res2[motions.join("|")] = compiled
                    }
                    
                    item.push(motions)
                }
            } 

            res = item
            // console.log(item)
            // console.log(metrics.gram[i])
        }

        console.log(res2)
    }
    
    static fromJson(letters, board) {
        let layout = new Layout()
        layout.board = new Board(board)

        for (const [i, ch] of Object.entries(letters)) {
            layout.keymap[layout.board.seq(i)] = ch
        }
        
        return layout
    }
}