class Util {
    /**
     * Get the combinations of an array
     * @param arr The range to get the combinations for
     * @param n The length of each combination
     * @returns Array of tuples containing the combinations
     */
    static combinations(arr: any[], n: number): any[][] {
        if (n == 1) {
            return arr.map((item) => [item])
        }

        const combinations: any[][] = []
        
        arr.forEach((item, index) => {
          const smallerCombinations = this.combinations(arr.slice(index + 1), n - 1)
          smallerCombinations.forEach((combo) => combinations.push([item, ...combo]))
        })

        return combinations
    }      
    
    /**
     * Computes the product of an array with repetition
     * @param array An array of arbitrary objects
     * @param repeat The number of times to repeat the array
     * @returns A list of the resulting products
     */
    static product(array: any[], repeat: number): any[] {
        return repeat == 0 ? [[]] : this.product(array, repeat - 1)
            .flatMap(x => array.map(y => [...x, y]))
    }

    /**
     * Zips two arrays into a dictionary, a la python
     * @param arr1 The array mapped to keys
     * @param arr2 The array mapped to values
     * @returns The dictionary
     */
    static dictzip(arr1: string, arr2: string): {[key: string]: string} {
        const res: {[key: string]: string} = {}
        for (let i=0; i < arr1.length; i++) {
            res[arr1[i]] = arr2[i]
        }

        return res
    }

    /**
     * Shuffles an array in place
     * @param arr The array to be shuffled
     */
    static shuffle(arr: any[]) {
        for (let i = arr.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}

class Grams {
    grams: {[key: string]: number}
    total: number
    
    /**
     * A set of ngrams and their counts
     * @param grams A dictionary mapping strings to counts
     * @param total The total gram count
     */
    constructor(grams?: {[key: string]: number}, total?: number) {
        this.grams = grams ?? {}
        this.total = total ?? 0
    }

    /**
     * Update the count of a gram
     * @param gram The ngram to be updated
     * @param count The amount of new occurrences (default 1)
     */
    add(gram: string, count: number = 1) {
        this.grams[gram] = (this.grams[gram] ?? 0) + count
        this.total += count
    }

    /**
     * Returns the top n ngrams, sorted
     * @param n The number of ngrams, n > 0 for n largest, n < 0 for n smallest, n = 0 for all
     * @returns A dictionary mapping the top grams to their counts
     */
    top(n: number = 0): string[] {
        const lBound = n < 0 ? n : 0
        const uBound = n > 0 ? n : this.grams.length
        
        return Object.keys(this.grams)
            .sort((a, b) => this.count(b) - this.count(a))
            .slice(lBound, uBound)
    }

    /**
     * Creates a new gram collection with the ngrams unshifted
     * @returns The new grams
     */
    unshift(): Grams {        
        const grams = new Grams()
        for (const [k, v] of Object.entries(this.grams)) {
            const gram = [...k].map(x => Grams.shift(x)).join("")
            grams.add(gram, v)
        }

        return grams
    }

    /**
     * Creates a new gram collection with ngrams filtered by some function
     * @param func The function to apply on each gram
     * @param gramTotal Set total equal to grams
     * @returns The new grams
     */
    filter(func: (x: string) => boolean, gramTotal: boolean = false): Grams {
        const grams = new Grams()
        for (const [k, v] of Object.entries(this.grams)) {
            if (func(k)) {
                grams.add(k, v)
            }
        }

        grams.total = gramTotal ? grams.total : this.total
        return grams
    }

    /**
     * Get the number of occurrences for any ngram
     * @param gram The gram to check for
     * @returns The amount of occurrences, zero if none found
     */
    count(gram: string): number {
        return this.grams[gram] ?? 0
    }

    /**
     * The number of occurrences of any ngram divided by the total
     * @param gram The gram to check for
     * @returns The percentage of the gram in grams
     */
    freq(gram: string): number {
        return this.count(gram) / this.total
    }

    /**
     * Convert any shifted character to its unshifted counterpart
     * @param char The char to unshift, or do nothing if not found
     * @returns An unshifted character
     */
    static shift(char: string): string {
        return Util.dictzip(
            '!@#$%^&*()_+:{}:<>?\"ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
            '1234567890-=;[];,./\'abcdefghijklmnopqrstuvwxyz',
        )[char] ?? char
    }
}

export class Corpus {
    gramSize: number
    skipSize: number
    gram: Grams[]
    skip: Grams[]
    word: Grams

    /**
     * Contains parsed corpus data
     * @param gramSize The maximum ngram size to process
     * @param skipSize The maximum skipgram distance
     */
    constructor(gramSize?: number, skipSize?: number) {
        this.gramSize = gramSize ?? 3
        this.skipSize = skipSize ?? 1

        this.gram = []
        this.skip = []
        this.word = new Grams()
    }

    get monogram(): Grams {
        return this.gram[0]
    }

    get bigram(): Grams {
        return this.gram[1]
    }

    get trigram(): Grams {
        return this.gram[2]
    }

    get skipgram(): Grams {
        return this.skip[0]
    }

    /**
     * Creates a new corpus with characters converted to their unshifted counterparts
     * @returns The new corpus
     */
    unshift(): Corpus {
        const corpus = new Corpus()

        for (const grams of this.gram) {
            corpus.gram.push(grams.unshift())
        }

        for (const skips of this.skip) {
            corpus.skip.push(skips.unshift())
        }

        corpus.word = this.word.unshift()
        return corpus
    }

    /**
     * Creates a new corpus with only ngrams that contain a set of letters
     * @param letters The set of letters that all ngrams must contain
     * @returns The new corpus
     */
    contains(letters: string) {
        const func = (x: string) => [...x].every(y => letters.includes(y))
        const corpus = new Corpus()
        
        for (const grams of this.gram) {
            corpus.gram.push(grams.filter(func, true))
        }
        
        for (const skips of this.skip) {
            corpus.skip.push(skips.filter(func, true))
        }

        corpus.word = this.word.filter(func, true)
        return corpus
    }

    /**
     * Builds a corpus class from text and populates it with ngrams, skips, and words
     * @param text The text to iterate over
     * @returns The new corpus
     */
    static fromText(text: string) {
        const corpus = new Corpus()

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
                const word = text.slice(wordIndex, i)

                if (word) {
                    corpus.word.add(word)
                }

                wordIndex = i + 1
            }
        }

        const word = text.slice(wordIndex)

        if (word) {
            corpus.word.add(word)
        }

        return corpus
    }
}

export class Pos {
    x: number
    y: number
    f: number
    h: number
    p: number
    /**
     * Describes the location and finger for a key on a keyboard
     * @param x The column offset of the key
     * @param y The row offset of the key
     * @param f The finger used to press this key
     * @param p The unique index of the key
     */
    constructor(x: number, y: number, f: number, p: number) {
        this.x = x
        this.y = y
        this.f = f
        this.h = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1][f]
        this.p = p
    }
}

export class Metric {
    name: string
    func: (...args: Pos[]) => boolean
    size: number
    /**
     * Wrapper class for metrics
     * @param name The name of the metric
     * @param func The metric function, which takes ...Pos and returns true when matched
     * @param size The length of the target ngram 
     */
    constructor(name: string, func: (...args: Pos[]) => boolean, size: number) {
        this.name = name
        this.func = func
        this.size = size
    }

    /**
     * Checks if the list of positions is a part of the metric definition
     * @param pos The list of positions
     * @returns Returns true if the sequence is an example of the metric
     */
    compile(...pos: Pos[]): boolean {
        return this.func(...pos)
    }

    /**
     * Creates a new monogram metric
     * @param name The name of the metric
     * @param func The metric function
     * @returns The new metric
     */
    static monogram(name: string, func: (...args: Pos[]) => boolean): Metric {
        return new Metric(name, func, 1)
    }

    /**
     * Creates a new bigram metric
     * @param name The name of the metric
     * @param func The metric function
     * @returns The new metric
     */
    static bigram(name: string, func: (...args: Pos[]) => boolean): Metric {
        return new Metric(name, func, 2)
    }

    /**
     * Creates a new trigram metric
     * @param name The name of the metric
     * @param func The metric function
     * @returns The new metric
     */
    static trigram(name: string, func: (...args: Pos[]) => boolean): Metric {
        return new Metric(name, func, 3)
    }
}

export class Metrics {
    metrics: Metric[]
    gram: Metric[][]

    /**
     * A collection of metrics
     * @param metrics A list of metrics
     */
    constructor(...metrics: Metric[]) {
        this.metrics = metrics
        this.gram = Array(3).fill(null).map(x => [])

        for (const metric of metrics) {
            this.gram[metric.size - 1].push(metric)
        }
    } 
    
    get monogram(): Metric[] {
        return this.gram[0]
    }

    get bigram(): Metric[] {
        return this.gram[1]
    }

    get trigram(): Metric[] {
        return this.gram[2]
    }
}

class Board {
    board: Pos[]
    table: [number[], Metric[]][]

    /**
     * A collection of key positions
     * @param board The list of positions
     */
    constructor(board: Pos[]) {
        this.board = board
        this.table = []
    }

    /**
     * Builds a table mapping ngram sequences to a set of stats
     * @param metrics A collection of metrics
     */
    compile(metrics: Metrics) {
        for (const [i, stats] of Object.entries(metrics.gram)) {
            for (const seq of Util.product([...this.board.keys()], parseInt(i) + 1)) {
                const pos = seq.map((x: number) => this.board[x]) 
                const compiled = stats.filter(x => x.compile(...pos))

                if (compiled.length) {
                    this.table.push([seq, compiled])
                }
            }
        }
    }

    /**
     * Stringified representation of a board
     * @param arr A sequence to map onto the board
     * @returns String representation
     */
    keymap(arr: string[]): string {
        let row: string[] = []
        let col: string[] = []
        
        let prev_x = -1
        let prev_y = 0
        let prev_h = 0
        for (const pos of this.board) {
            let ch = arr[pos.p] ?? "~"

            if (prev_h < pos.h) {
                ch = " " + ch
            }

            if (prev_y < pos.y) {
                col.push(row.join(" "))
                row = []
            }

            for (let i=0; i < Math.max(pos.x - prev_x - 1, 0); i++) {
                row.push(" ")
            }

            row.push(ch)

            prev_x = pos.x
            prev_y = pos.y
            prev_h = pos.h
        }

        if (row.length) {
            col.push(row.join(" "))
        }

        return col.join("\n")
    }
    
    /**
     * Creates a new board from an array of strings following typical fingermap formatting
     * @param arr A list of strings representing rows on a keyboard
     * @returns A new board
     */
    static fromArray(arr: string[]): Board {
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

        return new Board(board)
    }
}

export class Layout {
    name: string
    author: string
    board: Board
    layers: string[][]

    /**
     * Contains common layout information
     */
    constructor(name: string, author: string, board: Board, layers: string[][]) {
        this.name = name ?? "Untitled"
        this.author = author ?? "Unknown"
        this.board = board
        this.layers = layers
    }

    /**
     * Find the positions of a given char(s)
     * @param chars A string containing the chars to find
     * @returns A list of positions on the layout that contain those chars
     */
    pos(chars: string): Pos[] {
        return this.board.board.filter(x => chars.includes(this.layers[0][x.p]))
    }

    /**
     * Swap two positions on the layout
     * @param a The first position's index
     * @param b The second position's index
     */
    do_swap(a: number, b: number) {
        [this.layers[0][a], this.layers[0][b]] = [
            this.layers[0][b], this.layers[0][a]
        ]
    }

    /**
     * Undoes a swap
     * @param a The first position's index
     * @param b The second position's index
     */
    undo_swap(a: number, b: number) {
        this.do_swap(a, b)
    }

    /**
     * Creates the string representation of the layout's keys
     * @param layer Keymap layer, (default 0)
     * @returns String representation
     */
    keymap(layer: number = 0): string {
        return this.board.keymap([...this.layers[layer]])
    }

    /**
     * String representation of the fingermap of the layout
     * @returns String representation
     */
    fingermap(): string {
        return this.board.keymap(this.board.board.map(x => String(x.f)))
    }

    clone(): Layout {
        const newLayout = new Layout(
            "Generated",
            "KBJS",
            this.board,
            this.layers.map(x => [...x])
        )

        return newLayout
    }
    
    /**
     * Creates a layout from a layout json format
     * @param data The json data
     * @returns A new layout
     */
    static fromJson(data: any): Layout {
        return new Layout(
            data.name,
            data.author,
            Board.fromArray(data.board), 
            data.layers.map((x: string) => [...x]),
        )
    }
}

class ScoreBoard {
    stat: {[key: string]: {count: number, grams: Grams}}
    /**
     * Keeps track of stat calculations
     * @param corpus The corpus used to calculate the stats
     * @param metrics The metrics containing the stats
     */
    constructor(corpus: Corpus, metrics: Metrics) {
        this.stat = {} 
        for (const stat of metrics.metrics) {
            this.stat[stat.name] = {
                count: 0,
                grams: new Grams({}, corpus.gram[stat.size - 1].total),
            }
        }
    }

    /**
     * Updates the stat information
     * @param stats The list of stats to update
     * @param gram The gram to include as an example of the given stats
     * @param count The number of times the gram occurs in the corpus
     */
    update(stats: Metric[], gram: string, count: number) {
        for (const stat of stats.map(x => this.stat[x.name])) {
            stat.count += count
            stat.grams.grams[gram] = (stat.grams.grams[gram] ?? 0) + count
        }
    }

    /**
     * TD
     */
    score() {
        return this.stat["SFB"].count
    }

    /**
     * Gets the frequency for a given stat
     * @param stat The name of the stat
     * @returns A float representing the frequency of occurrence
     */
    freq(stat: string): number {
        return this.stat[stat].count / this.stat[stat].grams.total
    }

    /**
     * Gets examples of ngram frequencies for a given stat
     * @param stat The name of the stat
     * @returns A grams class containing the gram examples
     */
    examples(stat: string): Grams {
        return this.stat[stat].grams
    }
}

export class Analyzer {
    layout: Layout
    corpus: Corpus
    metrics: Metrics

    /**
     * Common analysis tools
     * @param data
     * @param data.layout The layout to use during analysis
     * @param data.corpus The corpus to source ngram data from
     * @param data.metrics The metrics to calculate
     */
    constructor(data: {layout: Layout, corpus: Corpus, metrics: Metrics}) {
        this.layout = data.layout
        this.corpus = data.corpus.unshift().contains(data.layout.layers.flat().join(""))
        this.metrics = data.metrics
        data.layout.board.compile(data.metrics)
    }

    /**
     * Calculates the score for a given layout
     * @returns A scoreboard containing score information
     */
    analyze(): ScoreBoard {
        const scores = new ScoreBoard(
            this.corpus, 
            this.metrics
        )

        for (const [seq, stats] of this.layout.board.table) {
            const gram = seq.map((x: number) => this.layout.layers[0][x]).join("")
            const count = this.corpus.gram[seq.length - 1].count(gram)
            scores.update(stats, gram, count)
        }

        return scores
    }

    /**
     * Generate some layouts from a base layout
     * @param rounds The number of layouts to generate
     * @returns A list of generated layouts
     */
    optimize(rounds: number = 1): Layout[] {
        const template = this.layout
        const layouts: Layout[] = []

        const combos = Util.combinations([...this.layout.layers[0].keys()], 2)
        
        for (let round = 0; round < rounds; round++) {
            this.layout = template.clone()
            let score = this.analyze().score()
    
            let running = true
            while (running) {
                running = false
                
                Util.shuffle(combos)
                for (const [a, b] of combos) {
                    this.layout.do_swap(a, b)
    
                    const new_score = this.analyze().score()
                    if (new_score < score) {
                        score = new_score
                        running = true
                        break
                    }
    
                    this.layout.undo_swap(a, b)
                }
            }
    
            layouts.push(this.layout)
        }

        this.layout = template
        return layouts
    }
}