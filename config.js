/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * System-wide configurations.
 */
var config = {}

// Application Information
config.app = {}
config.app.mode = {}
config.app.mode.DEVELOPMENT = 'development';
config.app.mode.PRODUCTION = 'production';
config.app.mode.current = config.app.mode.DEVELOPMENT;

// Log files
config.logger = {}
config.logger.dir = __dirname + '/logs/';
config.logger.errorFile = 'error.log';
config.logger.consoleFile = 'console.log';
config.logger.maxFileSize = 1000000;
config.logger.maxFiles = 1;

// Make the configuration parameters available.
module.exports = config;
