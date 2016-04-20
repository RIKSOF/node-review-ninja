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
  
  var org = config.github.org;
  
  // Get all repositories
  reviewer.getRepositories( org, function( repos ) {
    
    // For each repository, get the pull requests
    repos.forEach( function( r ) {
      reviewer.getAllPulls( org, r.name, function( req ) {
        console.log( JSON.stringify( req ) );
      });
    });
  });
  
  /*reviewer.getPullRequestDetails( url, function( details ) {
    reviewer.review( url, details.head.sha, function( fail ) {
      logger.info( 'Done searching!' );
    });
  });*/
//}, config.app.interval );

logger.info( 'Review Ninja is up and kicking...' );
