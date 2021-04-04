'use strict';

const assert = require('assert');

const request = require('supertest');
const {isAssertionExpression} = require('typescript');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

let rideId;

describe('API tests', () => {
  before((done) => {
    db.serialize((err) => {
      if (err) {
        return done(err);
      }

      buildSchemas(db);

      done();
    });
  });

  describe('GET /health', () => {
    it('should return health', (done) => {
      request(app)
          .get('/health')
          .expect('Content-Type', /text/)
          .expect(200, done);
    });
  });

  // start_lat
  // start_long
  // end_lat
  // end_long
  // rider_name
  // driver_name
  // driver_vehicle

  describe('POST /rides', () => {
    it('should return rider name error', (done) => {
      request(app)
          .post('/rides')
          .send({
            start_lat: 1.3521,
            start_long: 103.8198,
            end_lat: 1.3421,
            end_long: 103.8198,
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            assert.strictEqual(res.body.error_code, 'VALIDATION_ERROR');
            assert.strictEqual(res.body.message, 'Rider name must be a non empty string');
            done();
          })
          .catch((err) => done(err));
    });
  });

  describe('POST /rides', () => {
    it('should return driver name error', (done) => {
      request(app)
          .post('/rides')
          .send({
            start_lat: 1.3521,
            start_long: 103.8198,
            end_lat: 1.3421,
            end_long: 103.8198,
            rider_name: 'mary',
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            assert.strictEqual(res.body.error_code, 'VALIDATION_ERROR');
            assert.strictEqual(res.body.message, 'Driver name must be a non empty string');
            done();
          })
          .catch((err) => done(err));
    });
  });

  describe('POST /rides', () => {
    it('should return vehicle name error', (done) => {
      request(app)
          .post('/rides')
          .send({
            start_lat: 1.3521,
            start_long: 103.8198,
            end_lat: 1.3421,
            end_long: 103.8198,
            rider_name: 'mary',
            driver_name: 'john',
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            assert.strictEqual(res.body.error_code, 'VALIDATION_ERROR');
            assert.strictEqual(res.body.message, 'Vehicle name must be a non empty string');
            done();
          })
          .catch((err) => done(err));
    });
  });

  describe('POST /rides', () => {
    it('should return start pose error', (done) => {
      request(app)
          .post('/rides', {
            body: {
              start_lat: 100.0,
              start_long: 103.8198,
              end_lat: 1.3421,
              end_long: 103.8198,
            },
          })
          .expect('Content-Type', /json/)
          .expect(200, done);
    });
  });

  describe('POST /rides', () => {
    it('should return end pose error', (done) => {
      request(app)
          .post('/rides', {
            body: {
              start_lat: 1.3521,
              start_long: 103.8198,
              end_lat: 100.0,
              end_long: 103.8198,
            },
          })
          .expect('Content-Type', /json/)
          .expect(200, done);
    });
  });

  describe('GET /rides', () => {
    it('should fail to return all records from db', (done) => {
      request(app)
          .get('/rides')
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            assert.strictEqual(res.body.error_code, 'RIDES_NOT_FOUND_ERROR');
            assert.strictEqual(res.body.message, 'Could not find any rides');
            done();
          })
          .catch((err) => done(err));
    });
  });

  describe('GET /rides/:id', () => {
    it('should fail to find ride with matching id and not return any record', (done) => {
      rideId = 3;
      request(app)
          .get('/rides/' + rideId)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            assert.strictEqual(res.body.error_code, 'RIDES_NOT_FOUND_ERROR');
            assert.strictEqual(res.body.message, 'Could not find any rides');
            done();
          })
          .catch((err) => done(err));
    });
  });

  describe('POST /rides', () => {
    it('should add record to db and return rideID', (done) => {
      request(app)
          .post('/rides')
          .send({
            start_lat: 1.3521,
            start_long: 103.8198,
            end_lat: 1.3421,
            end_long: 103.8198,
            rider_name: 'mary',
            driver_name: 'john',
            driver_vehicle: 'toyota',
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            assert(Number.isInteger(Number(res.body[0].rideID)));
            done();
          })
          .catch((err) => done(err));
    });
  });

  describe('GET /rides', () => {
    it('should return all records from db', (done) => {
      request(app)
          .get('/rides')
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            assert.strictEqual(res.body.length, 1);
            assert(Number.isInteger(Number(res.body[0].rideID)));
            rideId = Number(res.body[0].rideID);
            done();
          })
          .catch((err) => done(err));
    });
  });

  describe('GET /rides/:id', () => {
    it('should return one record from db', (done) => {
      request(app)
          .get('/rides/' + rideId)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            assert(Number.isInteger(Number(res.body[0].rideID)));
            done();
          })
          .catch((err) => done(err));
    });
  });
});
