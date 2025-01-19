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
    
    const analyzer = new kb.Analyzer(
        kb.Layout.fromJson(layouts.pinev4),
        (await kb.Corpus.load("monkeyracer")),
        new kb.Metrics(
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
    )
    
    console.log(analyzer.analyze())
}

main()