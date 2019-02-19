const elasticClient = require('./elasticClient.js').getClient();
    
// TODO Remove this, should be read from a file.
const totalCounts = {
    1: 74127,
    2: 65122,
    3: 56597,
    4: 48408,
    5: 40725,
    6: 33766,
};
const INDEX = 'tamil-ngram';

function getQueryBody(ngrams) {
    /**
     * curl -X POST "localhost:9200/tamil-ngram/_search?size=0" -H 'Content-Type: application/json' -d'
{
    "query": {
       "terms" : { "ngram" : ["கொண்டிருந்தான்", "கொண்டிருந்தன"] } 
    },
    "aggs" : {
        "by_ngrams": {
            "terms": {
                "field" : "ngram"
            },
            "aggs" : {
                "by_year" : {
                    "terms" : {
                        "field" : "year", "order": {"_key": "asc" } 
                    },
                    "aggs": {
                        "total_count": { "sum": { "field": "count" } }
                    }
                }
            }
        }
    }
}
' */
    return body = {
        query: {
          terms: { "ngram": ngrams }
        },
        aggs: {
            "by_ngrams": {
                terms: { field: "ngram" },
                aggs: {
                    "by_year": {
                        terms: { field: "year", order: { _key: "asc" } },
                        aggs: {
                            "year_count": { 
                                "sum": { "field": "count" } 
                            }
                        }
                    }
                }
            }
        }
    };
}

function getTotalCount(year) {
    return totalCounts[year];
}

function transformNgrams(esResult) {
    // Ngrams per year or per book
    let result = {};
    let earlyYear = 2021;
    let recentYear = -2021;
    let ngramBuckets;
    if (esResult && esResult.aggregations && esResult.aggregations['by_ngrams']) {
        ngramBuckets = esResult.aggregations['by_ngrams'].buckets;
    }
    if (ngramBuckets) {
        for (let i = 0; i < ngramBuckets.length; i++) {
            let ngramBucket = ngramBuckets[i];
            result[ngramBucket.key] = {};
            let ngramCardinality = ngramBucket.key.split(' ').length;
            let yearBuckets = ngramBucket['by_year'].buckets;
            for (let j = 0; j < yearBuckets.length; j++) {
                let yearBucket =  yearBuckets[j];
                let year = yearBucket.key;
                if (year < earlyYear) {
                    earlyYear = year;
                }
                if (year > recentYear) {
                    recentYear = year;
                }
                let totalCount = getTotalCount(ngramCardinality);
                result[ngramBucket.key][year] = (yearBucket["year_count"].value / totalCount) * 100;
            }
        }
        Object.keys(result).forEach((ngram) => {
            for (let yr = earlyYear; yr <= recentYear; yr++) {
                if (!result[ngram][yr]) {
                    result[ngram][yr] = 0;
                }
            }
        });
    }
    return result;
}

module.exports.search = async function (ngrams) {
    let terms = ngrams.split(',').map((term) => term.trim());
    console.log('Incoming Terms: ', ngrams);

    return elasticClient.search({index: INDEX, body: getQueryBody(terms), size: 0})
        .then(results => {
            return transformNgrams(results);
        })
        .catch(err => {
            throw err;
        });
}
