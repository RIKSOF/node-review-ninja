// Dependencies
var winston = require( 'winston' );
var config = require( __dirname + '/../config' );

// Setup the logger
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
	  new (winston.transports.File)({
      name: 'file#error',
      filename: config.logger.dir + config.logger.errorFile, 
      level: 'error', 
      maxsize: config.logger.maxFileSize, 
      maxFiles: config.logger.maxFiles 
    }),
	  new (winston.transports.File)({ 
      name: 'file#all',
      filename: config.logger.dir + config.logger.consoleFile,
      maxsize: config.logger.maxFileSize,
      maxFiles: config.logger.maxFiles 
    })]
});

/**
 * Setup the directory.
 */
logger.setupDirectory = function () {
  var fs = require('fs');

  if ( !fs.existsSync( config.logger.dir ) ){
    fs.mkdirSync( config.logger.dir );
  }
}

// Make the logger available to all
module.exports = logger;