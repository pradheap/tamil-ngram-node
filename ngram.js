const elasticClient = require('./elasticClient.js').getClient();

const totalCounts = {
    1951: 2000,
    1952: 2400,
    1953: 3200,
    1954: 3000,
};
const INDEX = 'tamil-ngram';

function getQueryBody(terms) {
    return body = {
        sort: [
            { 
                "year" : {"order" : "asc"}
            },
        ],
        query: {
          terms: { "ngram": terms }
        },
    };
}

function getTotalCount(year) {
    const counts = {
        1955: 100000,
        1954: 100000,
        1953: 100000,
        1952: 100000,
        1951: 100000,
    };
    return counts[year];
}

function transformNgrams(esResults) {
    // Ngrams per year or per book
    let result = {};
    for (let i = 0; i < esResults.length; i++) {
        let res = esResults[i];
        if (res && res._source && res._source.ngram) {
            let year = res._source.year;
            let totalCount = getTotalCount(year);
            if (!totalCount) {
                throw new Error('No Total count found for ' + year);
            }
            if (!result[res._source.ngram]) {
                result[res._source.ngram] = {};
            }
            // Year gets converted into string and new Map() is not parsed right.
            result[res._source.ngram][year] = res._source.count / totalCount;
        }
    }
    return result;
}

module.exports.search = async function (ngrams) {
    let terms = ngrams.split(',');

    return elasticClient.search({index: INDEX, body: getQueryBody(terms)})
        .then(results => {
            return transformNgrams(results.hits.hits);
        })
        .catch(err => {
            throw err;
        });
}
