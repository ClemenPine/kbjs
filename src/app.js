import * as kb from "./kb.js"
import * as metric from "./metrics.js"

const layout = kb.Layout.fromJson("qlcmk'fuoynrstwpheaijxzgvbd;,.", [
    "0 1 2 3 3 6 6 7 8 9",
    "0 1 2 3 3 6 6 7 8 9",
    "0 1 2 3 3 6 6 7 8 9",
])

const metrics = new kb.Metrics(
    kb.Metric.bigram("Repeat", metric.repeat),
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

layout.compile(metrics)

// let corpus = (await kb.Corpus.load("monkeyracer"))
//     .unshift()
//     .contains("abcdefghijklmnopqrstuvwxyz',.;-/")

// let ngrams = corpus.word
// let filtered = ngrams.filter(x => x.endsWith(".") || x.endsWith(","))

// for (const gram of filtered.top(50)) {
//     console.log(gram, (ngrams.freq(gram) * 100).toFixed(3) + "%")
// }