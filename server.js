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

function start() {
  
  // Underscore library
  var _ = require( 'underscore' );

  //var ninja = setInterval( function( ) {
    logger.info( 'Searching for bad pull requests...' );
  
    var org = config.github.org;
    var allNewPulls = [];
  
    // Get all repositories
    reviewer.getRepositories( org, function( repos ) {
      
      // Once all the repositories are polled
      var doneWithRepo = _.after( repos.length, function() {
        pulls.list = allNewPulls;
        pulls.save();
      })
    
      // For each repository, get the pull requests
      repos.forEach( function( r ) {
        reviewer.getAllPulls( org, r.name, function( ps ) {
          
          // Calculate the pulls that need to be reviewed.
          var updatedPs = pulls.update( ps );
          
          // Once all the pull for this repository are polled.
          if ( updatedPs.length > 0 ) {
            var doneWithPulls = _.after( updatedPs.length, function() {
              doneWithRepo();
            });
          
            updatedPs.forEach( function( p ) {
              console.log( p.html_url );
              doneWithPulls();
            });
          } else {
            doneWithRepo();
          }
        
          allNewPulls = allNewPulls.concat( ps );
        });
      });
    });
  
    /*reviewer.getPullRequestDetails( url, function( details ) {
      reviewer.review( url, details.head.sha, function( fail ) {
        logger.info( 'Done searching!' );
      });
    });*/
  //}, config.app.interval );
}

// Setup the directories if they are not there. This is done just once.
logger.setupDirectory();

// Pulls request model
var pulls = require( __dirname + '/models/Pulls');
pulls.load( function() {
  start();
});

logger.info( 'Review Ninja is up and kicking...' );
