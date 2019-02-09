var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'debug'
});

module.exports = {
    getClient: function () {
      return client;
    },
};
