/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Main Server.
 */

// Get the configurations
var config = require( __dirname + '/config' );

// Our logger for logging to file and console
var logger = require( __dirname + '/services/Logger' );

// Setup the directories if they are not there. This is done just once.
logger.setupDirectory();

var ninja = setInterval( function( ) {
  logger.info( 'Searching for bad pull requests...' );
  
  
  
  logger.info( 'Done searching!' );
}, config.app.interval );

logger.info( 'Review Ninja is up and kicking...' );
