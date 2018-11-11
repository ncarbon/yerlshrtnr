const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const redis = require('redis');
const expect = chai.expect;
const client = redis.createClient();

chai.use(chaiHttp);

var url, ttl, customId, shortId;

describe('index', () => {
    beforeEach((done) => {
        url = 'https://devcenter.heroku.com/articles/custom-domains#add-a-custom-domain-with-a-subdomain';
        ttl = 60;
        customId = 'mayo';

        done();
    });

    after((done) => {
        client.flushdb();
        done();
    });

    /*
        /api/shorturl POST route TEST
    */
   describe('POST request for short url /api/shorturl', () => {
       it('should return the short url', (done) => {
            chai.request(server)
                .post('/api/shorturl')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({url: url})
                .end((err, res) => {
                    expect(res).to.have.status(200)
                     expect(res.body).to.have.nested.property('shortURL');
                    done();
                });
       });

       it('should return URL with requested custom id', (done) => {
            chai.request(server)
            .post('/api/shorturl')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send({url: url, customId: customId})
            .end((err, res) => {
                console.log(res.body)
                expect(res).to.have.status(200)
                expect(res.body).to.have.nested.property('shortURL');
                expect(res.body.shortURL).to.match(new RegExp('http://localhost:3100/' + customId));
                done();
            });
       });

       it('should return URL with expiration', (done) => {
        chai.request(server)
        .post('/api/shorturl')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({url: url, ttl: ttl})
        .end((err, res) => {
            console.log(res.body)
            expect(res).to.have.status(200)
            expect(res.body).to.have.nested.property('shortURL');
            expect(res.body.expires).to.be.true;
            expect(parseInt(res.body.ttl)).to.be.equal(ttl);
            done();
        });
   });
   });
});