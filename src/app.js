'use strict';

const logger = require('./logger');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const startPoseErrorMsg = 'Start latitude and longitude must be between' +
' -90 - 90 and -180 to 180 degrees respectively';
const endPoseErrorMsg = 'End latitude and longitude must be between' +
' -90 - 90 and -180 to 180 degrees respectively';
const riderNameErrorMsg = 'Rider name must be a non empty string';
const driverNameErrorMsg = 'Driver name must be a non empty string';
const vehicleNameErrorMsg = 'Vehicle name must be a non empty string';
const noRideFoundErrorMsg = 'Could not find any rides';

module.exports = (db) => {
  app.get('/health', (req, res) => res.send('Healthy'));

  app.post('/rides', jsonParser, (req, res) => {
    const startLatitude = Number(req.body.start_lat);
    const startLongitude = Number(req.body.start_long);
    const endLatitude = Number(req.body.end_lat);
    const endLongitude = Number(req.body.end_long);
    const riderName = req.body.rider_name;
    const driverName = req.body.driver_name;
    const driverVehicle = req.body.driver_vehicle;

    if (startLatitude < -90 || startLatitude > 90 ||
      startLongitude < -180 || startLongitude > 180) {
      logger.error(startPoseErrorMsg, {
        error_code: 'VALIDATION_ERROR',
      });
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: startPoseErrorMsg,
      });
    }

    if (endLatitude < -90 || endLatitude > 90 ||
      endLongitude < -180 || endLongitude > 180) {
      logger.error(endPoseErrorMsg, {
        error_code: 'VALIDATION_ERROR',
      });
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: endPoseErrorMsg,
      });
    }

    if (typeof riderName !== 'string' || riderName.length < 1) {
      logger.error(riderNameErrorMsg, {
        error_code: 'VALIDATION_ERROR',
      });
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: riderNameErrorMsg,
      });
    }

    if (typeof driverName !== 'string' || driverName.length < 1) {
      logger.error(driverNameErrorMsg, {
        error_code: 'VALIDATION_ERROR',
      });
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: driverNameErrorMsg,
      });
    }

    if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
      logger.error(vehicleNameErrorMsg, {
        error_code: 'VALIDATION_ERROR',
      });
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: vehicleNameErrorMsg,
      });
    }

    const values = [req.body.start_lat, req.body.start_long, req.body.end_lat,
      req.body.end_long, req.body.rider_name, req.body.driver_name,
      req.body.driver_vehicle];

    db.run('INSERT INTO Rides(startLat, startLong,' +
    ' endLat, endLong, riderName, driverName, driverVehicle)' +
    ' VALUES (?, ?, ?, ?, ?, ?, ?)', values, function(err) {
      if (err) {
        logger.error('Unknown error', {
          error_code: 'SERVER_ERROR',
        });
        return res.send({
          error_code: 'SERVER_ERROR',
          message: 'Unknown error',
        });
      }

      db.all('SELECT * FROM Rides WHERE rideID = ?',
          this.lastID, function(err, rows) {
            if (err) {
              logger.error('Unknown error', {
                error_code: 'SERVER_ERROR',
              });
              return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error',
              });
            }

            res.send(rows);
          });
    });
  });

  app.get('/rides', (req, res) => {
    db.all('SELECT * FROM Rides', function(err, rows) {
      if (err) {
        logger.error('Unknown error', {
          error_code: 'SERVER_ERROR',
        });
        return res.send({
          error_code: 'SERVER_ERROR',
          message: 'Unknown error',
        });
      }

      if (rows.length === 0) {
        logger.error(noRideFoundErrorMsg, {
          error_code: 'RIDES_NOT_FOUND_ERROR',
        });
        return res.send({
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: noRideFoundErrorMsg,
        });
      }

      res.send(rows);
    });
  });

  app.get('/rides/:id', (req, res) => {
    db.all(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`,
        function(err, rows) {
          if (err) {
            logger.error('Unknown error', {
              error_code: 'SERVER_ERROR',
            });
            return res.send({
              error_code: 'SERVER_ERROR',
              message: 'Unknown error',
            });
          }

          if (rows.length === 0) {
            logger.error(noRideFoundErrorMsg, {
              error_code: 'RIDES_NOT_FOUND_ERROR',
            });
            return res.send({
              error_code: 'RIDES_NOT_FOUND_ERROR',
              message: noRideFoundErrorMsg,
            });
          }

          res.send(rows);
        });
  });

  return app;
};
