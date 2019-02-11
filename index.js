const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');

const cors = corsMiddleware({
    origins: ['https://tamil.rocks', 'http://localhost:8081'],
});

const ngram = require('./ngram');

const server = restify.createServer({
    name: 'Tamil Ngram Server',
    version: '1.0.0'
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.post('/ngram', function (req, res, next) {
    ngram.search(req.body.ngrams).then((results) => {
        res.send(results);
        return next();
    }).catch(err => {
        return next(err);
    });
});

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});
