class Util {
    /**
     * Computes the product of an array with repetition
     * @param {Object[]} array An array of arbitrary objects
     * @param {number} repeat The number of times to repeat the array
     * @returns {Object[]} A list of the resulting products
     */
    static product(array, repeat) {
        return repeat == 0 ? [[]] : this.product(array, repeat - 1)
            .flatMap(x => array.map(y => [...x, y]))
    }

    /**
     * Zips two arrays into a dictionary, a la python
     * @param {Object[]} arr1 The array mapped to keys
     * @param {Object[]} arr2 The array mapped to values
     * @returns {any} The dictionary
     */
    static dictzip(arr1, arr2) {
        const res = {}
        for (let i=0; i < arr1.length; i++) {
            res[arr1[i]] = arr2[i]
        }

        return res
    }
}

class Grams {
    /**
     * A set of ngrams and their counts
     * @param {any} grams A dictionary mapping strings to counts
     * @param {number} total The total gram count
     */
    constructor(grams, total) {
        this.grams = grams ?? {}
        this.total = total ?? 0
    }

    /**
     * Update the count of a gram
     * @param {string} gram The ngram to be updated
     * @param {number} count The amount of new occurrences (default 1)
     */
    add(gram, count = 1) {
        this.grams[gram] = (this.grams[gram] ?? 0) + count
        this.total += count
    }

    /**
     * Returns the top n ngrams, sorted
     * @param {number} n The number of ngrams, n > 0 for n largest, n < 0 for n smallest, n = 0 for all
     * @returns {any} A dictionary mapping the top grams to their counts
     */
    top(n = 0) {
        let lBound = n < 0 ? n : 0
        let uBound = n > 0 ? n : this.grams.length
        
        return Object.keys(this.grams)
            .sort((a, b) => this.count(a) < this.count(b))
            .slice(lBound, uBound)
    }

    /**
     * Creates a new gram collection with the ngrams unshifted
     * @returns {Grams} The new grams
     */
    unshift() {        
        let grams = new Grams()
        for (const [k, v] of Object.entries(this.grams)) {
            let gram = [...k].map(x => Grams.shift(x)).join("")
            grams.add(gram, v)
        }

        return grams
    }

    /**
     * Creates a new gram collection with ngrams filtered by some function
     * @param {any} func The function to apply on each gram
     * @returns {Grams} The new grams
     */
    filter(func) {
        let grams = new Grams()
        for (const [k, v] of Object.entries(this.grams)) {
            if (func(k)) {
                grams.add(k, v)
            }
        }

        return grams
    }

    /**
     * Get the number of occurrences for any ngram
     * @param {string} gram The gram to check for
     * @returns {number} The amount of occurrences, zero if none found
     */
    count(gram) {
        return this.grams[gram] ?? 0
    }

    /**
     * The number of occurrences of any ngram divided by the total
     * @param {string} gram The gram to check for
     * @returns {number} The percentage of the gram in grams
     */
    freq(gram) {
        return this.count(gram) / this.total
    }

    /**
     * Convert any shifted character to its unshifted counterpart
     * @param {string} char The char to unshift, or do nothing if not found
     * @returns {string} An unshifted character
     */
    static shift(char) {
        return Util.dictzip(
            '!@#$%^&*()_+:{}:<>?\"ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
            '1234567890-=;[];,./\'abcdefghijklmnopqrstuvwxyz',
        )[char] ?? char
    }
}

export class Corpus {
    /**
     * Contains parsed corpus data
     * @param {number} gramSize The maximum ngram size to process
     * @param {number} skipSize The maximum skipgram distance
     */
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

    /**
     * Creates a new corpus with characters converted to their unshifted counterparts
     * @returns {Grams} The new corpus
     */
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

    /**
     * Creates a new corpus with only ngrams that contain a set of letters
     * @param {string} letters The set of letters that all ngrams must contain
     * @returns The new corpus
     */
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

    /**
     * Builds a corpus class from text and populates it with ngrams, skips, and words
     * @param {string} text The text to iterate over
     * @returns The new corpus
     */
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

    /**
     * Loads in text from a file and constructs a corpus from it
     * @param {string} url The name of the corpus
     * @returns The new corpus
     */
    static async load(url) {
        let text = await (await fetch(`corpora/${url}.txt`)).text()
        return Corpus.fromText(text)
    }
}

class Pos {
    /**
     * Describes the location and finger for a key on a keyboard
     * @param {number} x The column offset of the key
     * @param {number} y The row offset of the key
     * @param {number} f The finger used to press this key
     * @param {number} p The unique index of the key
     */
    constructor(x, y, f, p) {
        this.x = x
        this.y = y
        this.f = f
        this.h = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1][f]
        this.p = p
    }
}

export class Metric {
    /**
     * Wrapper class for metrics
     * @param {string} name The name of the metric
     * @param {any} func The metric function, which takes ...Pos and returns true when matched
     * @param {size} size The length of the target ngram 
     */
    constructor(name, func, size) {
        this.name = name
        this.func = func
        this.size = size
    }

    /**
     * Checks if the list of positions is a part of the metric definition
     * @param {Pos[]} pos The list of positions
     * @returns {boolean} Returns true if the sequence is an example of the metric
     */
    compile(...pos) {
        return this.func(...pos)
    }

    /**
     * Creates a new monogram metric
     * @param {string} name The name of the metric
     * @param {any} func The metric function
     * @returns {Metric} The new metric
     */
    static monogram(name, func) {
        return new Metric(name, func, 1)
    }

    /**
     * Creates a new bigram metric
     * @param {string} name The name of the metric
     * @param {any} func The metric function
     * @returns {Metric} The new metric
     */
    static bigram(name, func) {
        return new Metric(name, func, 2)
    }

    /**
     * Creates a new trigram metric
     * @param {string} name The name of the metric
     * @param {any} func The metric function
     * @returns {Metric} The new metric
     */
    static trigram(name, func) {
        return new Metric(name, func, 3)
    }
}

export class Metrics {
    /**
     * A collection of metrics
     * @param {Metric[]} metrics A list of metrics
     */
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
    /**
     * A collection of key positions
     * @param {Pos[]} board The list of positions
     */
    constructor(board) {
        this.board = board
        this.table = []
    }

    /**
     * Builds a table mapping ngram sequences to a set of stats
     * @param {Metrics} metrics A collection of metrics
     */
    compile(metrics) {
        for (const [i, stats] of Object.entries(metrics.gram)) {
            for (const seq of Util.product([...this.board.keys()], parseInt(i) + 1)) {
                const pos = seq.map(x => this.board[x]) 
                const compiled = stats.filter(x => x.compile(...pos))

                if (compiled.length) {
                    this.table.push([seq, compiled])
                }
            }
        }
    }
    
    /**
     * Creates a new board from an array of strings following typical fingermap formatting
     * @param {string[]} arr A list of strings representing rows on a keyboard
     * @returns {Board} A new board
     */
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

        return new Board(board)
    }
}

export class Layout {
    /**
     * Contains common layout information
     * @param {Object} data
     * @param {string} data.name
     * @param {string} data.author
     * @param {Board} data.board
     * @param {string[]} data.layers
     */
    constructor({name, author, board, layers}) {
        this.name = name ?? "Untitled"
        this.author = author ?? "Unknown"
        this.board = board
        this.layers = layers
    }
    
    /**
     * Creates a layout from a layout json format
     * @param {any} data The json data
     */
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
    /**
     * Keeps track of stat calculations
     * @param {Object} data
     * @param {Corpus} data.corpus The corpus used to calculate the stats
     * @param {Metrics} data.metrics The metrics containing the stats
     */
    constructor({corpus, metrics}) {
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
     * @param {Object} data
     * @param {Metric[]} data.stats The list of stats to update
     * @param {string} data.gram The gram to include as an example of the given stats
     * @param {number} data.count The number of times the gram occurs in the corpus
     */
    update({stats, gram, count}) {
        for (const stat of stats.map(x => this.stat[x.name])) {
            stat.count += count
            stat.grams.grams[gram] = (stat.grams.grams[gram] ?? 0) + count
        }
    }
}

export class Analyzer {
    /**
     * Common analysis tools
     * @param {Object} data
     * @param {Layout} data.layout The layout to use during analysis
     * @param {Corpus} data.corpus The corpus to source ngram data from
     * @param {Metrics} data.metrics The metrics to calculate
     */
    constructor({layout, corpus, metrics}) {
        this.layout = layout
        this.corpus = corpus.unshift().contains(layout.layers.flat())
        this.metrics = metrics
        layout.board.compile(metrics)
    }

    /**
     * Calculates the score for a given layout
     * @returns {ScoreBoard} A scoreboard containing score information
     */
    analyze() {
        const scores = new ScoreBoard({
            corpus: this.corpus, 
            metrics: this.metrics
        })

        for (const [seq, stats] of this.layout.board.table) {
            const gram = seq.map(x => this.layout.layers[0][x]).join("")
            const count = this.corpus.gram[seq.length - 1].count(gram)
            scores.update({stats: stats, gram: gram, count: count})
        }

        return scores
    }

    /**
     * TD
     */
    generate() {
        
    }
}