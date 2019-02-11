const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'warning'
});

module.exports = {
    getClient: function () {
      return client;
    },
};
