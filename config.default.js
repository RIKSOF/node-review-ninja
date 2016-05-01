'use strict';

/**
 * @author Copyright RIKSOF (Private) Limited 2016.
 *
 * @file System-wide configurations.
 */
var config = {};

// Application Information
config.app = {};
config.app.data = __dirname + '/pulls.txt';
config.app.interval = 300000;
config.app.commentInterval = 5000;
config.app.mode = {}
config.app.mode.TESTING = 'testing';
config.app.mode.DEVELOPMENT = 'development';
config.app.mode.PRODUCTION = 'production';
config.app.mode.current = config.app.mode.DEVELOPMENT;

// Log files
config.logger = {};
config.logger.dir = __dirname + '/logs/';
config.logger.errorFile = 'error.log';
config.logger.consoleFile = 'console.log';
config.logger.maxFileSize = 1000000;
config.logger.maxFiles = 1;

// GitHub Connection
config.github = {};
config.github.timeout = 5000;
config.github.org = '';
config.github.personalToken = '';

// Make the configuration parameters available.
module.exports = config;
