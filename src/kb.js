class Util {
    static product(array, repeat) {
        return repeat == 0 ? [[]] : this.product(array, repeat - 1)
            .flatMap(x => array.map(y => [...x, y]))
    }

    static dictzip(arr1, arr2) {
        const res = {}
        for (let i=0; i < arr1.length; i++) {
            res[arr1[i]] = arr2[i]
        }

        return res
    }
}

class Grams {
    constructor(grams, total) {
        this.grams = grams ?? {}
        this.total = total ?? 0
    }

    add(gram, count = 1) {
        this.grams[gram] = (this.grams[gram] ?? 0) + count
        this.total += count
    }

    top(n = 0) {
        let lBound = n < 0 ? n : 0
        let uBound = n > 0 ? n : this.grams.length
        
        return Object.keys(this.grams)
            .sort((a, b) => this.count(a) < this.count(b))
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

    count(gram) {
        return this.grams[gram] ?? 0
    }

    freq(gram) {
        return this.count(gram) / this.total
    }

    static shift(char) {
        return Util.dictzip(
            '!@#$%^&*()_+:{}:<>?\"ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
            '1234567890-=;[];,./\'abcdefghijklmnopqrstuvwxyz',
        )[char] ?? char
    }
}

export class Corpus {
    constructor(gramSize, skipSize) {
        this.gramSize = gramSize ?? 3
        this.skipSize = skipSize ?? 1

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

        console.log("Loaded Corpus")

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
        this.metrics = metrics
        this.gram = Array(3).fill(null).map(x => [])

        for (const metric of metrics) {
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

class Board {
    static fromArray(arr) {
        const board = []

        let index = 0
        for (const [y, row] of Object.entries(arr ?? {})) {
            for (const [x, f] of Object.entries(row.split(/\s+/))) {
                if (Number.isInteger(Number(f))) {
                    board.push(new Pos(
                        parseInt(x),
                        parseInt(y),
                        parseInt(f),
                        index
                    ))
    
                    index += 1
                }
            }
        }

        return board
    }
}

export class Layout {
    constructor({name, author, board, layers}) {
        this.name = name ?? "Untitled"
        this.author = author ?? "Unknown"
        this.board = board
        this.layers = layers
    }
    
    static fromJson(data) {
        return new Layout({
            name: data.name,
            author: data.author,
            board: Board.fromArray(data.board), 
            layers: data.layers.map(x => [...x]),
        })
    }
}

class ScoreBoard {
    constructor({corpus, metrics}) {
        this.stat = {} 
        for (const stat of metrics.metrics) {
            this.stat[stat.name] = {
                count: 0,
                grams: new Grams({}, corpus.gram[stat.size - 1].total),
            }
        }
    }

    update({stats, gram, count}) {
        for (const stat of stats.map(x => this.stat[x.name])) {
            stat.count += count
            stat.grams.grams[gram] = (stat.grams.grams[gram] ?? 0) + count
        }
    }
}

export class Analyzer {
    constructor({layout, corpus, metrics}) {
        this.layout = layout
        this.corpus = corpus.unshift().contains(layout.layers.flat())
        this.metrics = metrics
        this.compile()
    }

    compile() {
        this.table = []
        for (const [i, stats] of Object.entries(this.metrics.gram)) {
            for (const seq of Util.product([...this.layout.board.keys()], parseInt(i) + 1)) {
                const pos = seq.map(x => this.layout.board[x]) 
                const compiled = stats.filter(x => x.compile(...pos))

                if (compiled.length) {
                    this.table.push([seq, compiled])
                }
            }
        }
    }

    analyze() {
        const scores = new ScoreBoard({
            corpus: this.corpus, 
            metrics: this.metrics
        })

        for (const [seq, stats] of this.table) {
            const gram = seq.map(x => this.layout.layers[0][x]).join("")
            const count = this.corpus.gram[seq.length - 1].count(gram)
            scores.update({stats: stats, gram: gram, count: count})
        }

        return scores
    }

    generate() {
        
    }
}