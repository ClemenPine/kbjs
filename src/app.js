import * as kb from "./kb.js"
import * as metric from "./metrics.js"

const layouts = {
    pinev4: {
        "name": "Pine V4",
        "author": "ClemenPine",
        "layers": [
            "qlcmk'fuoynrstwpheaijxzgvbd;,.",
        ], 
        "board": [
            "0 1 2 3 3 6 6 7 8 9",
            "0 1 2 3 3 6 6 7 8 9",
            "0 1 2 3 3 6 6 7 8 9"
        ]
    },
    buggy: {
        "name": "Buggy",
        "author": "Flarefin",
        "layers": [
            "ldymounrtshaie",
            "xvgkq,pwbcfz.j"
        ], 
        "board": [
            "~ 1 2 3  6 7 8 ~",
            "0 1 2 3  6 7 8 9",
        ]
    }
}

const analyzer = new kb.Analyzer({
    layout: kb.Layout.fromJson(layouts.pinev4),
    corpus: (await kb.Corpus.load("monkeyracer")),
    metrics: new kb.Metrics(
        kb.Metric.bigram("Same Finger", metric.same_finger),
        kb.Metric.bigram("Lateral Stretch", metric.lateral_stretch),
        kb.Metric.bigram("Half Scissor", metric.half_scissor),
        kb.Metric.bigram("Full Scissor", metric.full_scissor),
        kb.Metric.trigram("Redirect", metric.redirect),
        kb.Metric.trigram("Onehand", metric.onehand),
        kb.Metric.trigram("Roll", metric.roll),
        kb.Metric.trigram("Inward Roll", metric.inroll),
        kb.Metric.trigram("Outward Roll", metric.outroll),
    )
})

console.log(analyzer.analyze())

// const scores = analyzer.analyze()
// for (const [name, item] of Object.entries(scores)) {
//     console.log(name, (item.count / item.total * 100).toFixed(3) + "%")
//     for (const gram of item.grams.top(10)) {
//         console.log(gram, (item.grams.freq(gram) * 100).toFixed(3) + "%")
//     }

//     console.log()
// }

// let corpus = (await kb.Corpus.load("monkeyracer"))
//     .unshift()
//     .contains("abcdefghijklmnopqrstuvwxyz',.;-/")

// let ngrams = corpus.word
// let filtered = ngrams.filter(x => x.endsWith(".") || x.endsWith(","))

// for (const gram of filtered.top(50)) {
//     console.log(gram, (ngrams.freq(gram) * 100).toFixed(3) + "%")
// }