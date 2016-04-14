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

// Setup git token.
var github = require( __dirname + '/services/GitHub' );
github.setup( config.github.personalToken );

// Diff service
var diff = require( __dirname + '/services/Diff' );

var ninja = setInterval( function( ) {
  logger.info( 'Searching for bad pull requests...' );
  
  github.getDiff( 'https://github.com/RIKSOF/yayvo/pull/537', function(err, res) {
    if ( err ) {
      logger.error( err );
    } else {
      var lines = diff.getChanges( res );
    }
  });
  
  logger.info( 'Done searching!' );
}, config.app.interval );

logger.info( 'Review Ninja is up and kicking...' );
