import * as fs from "fs"
import * as path from "path"
import express, { Application, Request, Response } from "express";

import * as kb from "./kb.js"
import * as metric from "./metrics.js"

class API {
    readonly LAYOUT_DIR = "./layouts"
    readonly CORPUS_DIR = "./corpora"

    layouts: {[key: string]: kb.Layout}
    corpora: {[key: string]: kb.Corpus}

    constructor() {
        console.log("Starting API:")
        console.log("  Loading Layouts...")
        this.layouts = {}
        for (const file of fs.readdirSync(this.LAYOUT_DIR)) {
            const raw = fs.readFileSync(path.join(this.LAYOUT_DIR, file), "utf8")
            const data = JSON.parse(raw)

            const ll = kb.Layout.fromJson(data)
            this.layouts[ll.name] = ll
        }

        console.log("  Loading Corpora...")
        this.corpora = {}
        for (const file of fs.readdirSync(this.CORPUS_DIR)) {
            const text = fs.readFileSync(path.join(this.CORPUS_DIR, file), "utf8")

            const corpus = kb.Corpus.fromText(text)
            this.corpora[file.slice(0, -4)] = corpus
        }

        console.log("  Done!")
    }

    grams(data: {corpName: string, ngram: number, n: number, noshift: boolean, nospace: boolean}): [string, number][] {
        const res: [string, number][] = []

        let grams = this.corpora[data.corpName ?? "monkeyracer"].gram[data.ngram - 1]
        grams = data.noshift ? grams.unshift() : grams
        grams = data.nospace ? grams.filter(x => !x.includes(" "), true) : grams

        for (const gram of grams.top(data.n ?? 50)) {
            res.push([gram, grams.freq(gram)])
        }

        return res
    }
}

class App {
    app: Application
    port: number
    api: API

    constructor() {
        this.app = express()
        this.port = 3500
        this.api = new API()

        this.app.use(express.json())
        this.initRoutes()

        this.app.listen(this.port, () => {
            console.log(`Server running on http://localhost:${this.port}`)
        });
    }

    private initRoutes(): void {
        this.app.post("/api/v1/grams", (req: Request, res: Response) => {
            if (!req.body.corpus || !req.body.ngram) {
                res.status(400).json({
                    message: "Missing required fields corpus and ngram"
                })
            } else if (!this.api.corpora[req.body.corpus]) {
                res.status(400).json({
                    message: `Undefined corpus ${req.body.corpus}`
                })
            } else if (req.body.ngram < 1 || req.body.ngram > 3) {
                res.status(400).json({
                    message: "Ngrams must be between 1-3"
                })
            } else {
                res.json(this.api.grams({
                    corpName: req.body.corpus,
                    ngram: req.body.ngram,
                    n: req.body.count ?? 50,
                    noshift: req.body.noshift ?? false,
                    nospace: req.body.nospace ?? true,
                }))
            }
        })
    }
}

new App()