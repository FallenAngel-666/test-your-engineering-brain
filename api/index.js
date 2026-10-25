/**
 * Vercel Serverless Function Entry Point
 * Routes incoming HTTP requests directly into the Express application.
 */

const app = require('../server.js');

module.exports = (req, res) => {
  return app(req, res);
};
