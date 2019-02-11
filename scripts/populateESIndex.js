const elasticClient = require('./../elasticClient.js').getClient();
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

const INDEX = 'tamil-ngram';

// Stand alone script to populate ES from a ngram csv file of the format:
// ngram (unicode), count, year, book name (slugified in english)

if (!argv['file']) {
    throw Error('File is a must');
}

const filePath = argv['file'];
const logging = argv['log-level'];
let esData = {};


function readAndParseData() {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) reject(err);
            data.split('\n').forEach((line) => {
                if (line) {
                    words = line.split(',').map((word) => {
                        return word.trim();
                    });
                    esData[words[0]] = {
                        "ngram": words[1],
                        "count": parseInt(words[2]),
                        "year": parseInt(words[3]),
                        "book": words[4],
                    };
                }
            });
            resolve();
        });
    });
}

readAndParseData().then(() => {
    Object.keys(esData).forEach((key) => {
        elasticClient.index({
            index: INDEX,
            id: key,
            type: '_doc',
            body: esData[key],
        }).then((result) => {
            if (logging === 'debug') {
                console.log(result);
            }
        }).catch((err) => {
            console.log(err)
            throw err;
        });
    });
});
