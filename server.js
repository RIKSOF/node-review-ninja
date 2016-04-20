/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Main Server.
 */

// Get the configurations
var config = require( __dirname + '/config' );

// Our logger for logging to file and console
var logger = require( __dirname + '/services/Logger' );

// Reviewer Service
var reviewer = require( __dirname + '/services/Reviewer');

// Setup the directories if they are not there. This is done just once.
logger.setupDirectory();

//var ninja = setInterval( function( ) {
  logger.info( 'Searching for bad pull requests...' );
  
  reviewer.review( 'https://github.com/RIKSOF/yayvo/pull/527', function( fail ) {
    logger.info( 'Done searching!' );
  });
//}, config.app.interval );

logger.info( 'Review Ninja is up and kicking...' );
