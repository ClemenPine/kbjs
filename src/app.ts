import * as kb from "./kb.js"
import * as metric from "./metrics.js"

async function main() {
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
    
    const layout = kb.Layout.fromJson(layouts.pinev4)
    // const layout = kb.Layout.fromJson(layouts.buggy)
    
    const analyzer = new kb.Analyzer({
        layout: layout,
        corpus: (await kb.Corpus.load("monkeyracer")),
        metrics: new kb.Metrics(
            kb.Metric.bigram("SFB", metric.same_finger),
            kb.Metric.bigram("LSB", metric.lateral_stretch),
            kb.Metric.bigram("HSB", metric.half_scissor),
            kb.Metric.bigram("FSB", metric.full_scissor),
            kb.Metric.trigram("Redirect", metric.redirect),
            kb.Metric.trigram("Roll", metric.roll),
            kb.Metric.trigram("Inroll", metric.inroll),
            kb.Metric.trigram("Outroll", metric.outroll),
            kb.Metric.trigram("Onehand", metric.onehand),
            kb.Metric.trigram("Inhand", metric.inhand),
            kb.Metric.trigram("Outhand", metric.outhand),
        )
    })
    
    console.log(layout.keymap())
    const scores = analyzer.analyze()

    const stat = "SFB"
    const freq = scores.freq(stat)
    const sfbs = scores.examples(stat)

    console.log(`Example of ${stat} (${(freq * 100).toFixed(3)}%)`)
    for (const x of sfbs.top(10)) {
        console.log(x, (sfbs.freq(x) * 100).toFixed(3) + "%")
    }
}

main()