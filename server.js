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
var reviewer = require( __dirname + '/services/Reviewer' );

function start() {
  
  // Underscore library
  var _ = require( 'underscore' );
  
  // Set the commenter
  reviewer.commenter = require( __dirname + '/services/Commenter' );

  logger.info( 'Searching for bad pull requests...' );
  
  var org = config.github.org;
  var allNewPulls = [];
  
  // Get all repositories
  reviewer.getRepositories( org, function( repos ) {
      
    // Once all the repositories are polled
    if ( repos !== null && repos.length > 0 ) {
      var doneWithRepo = _.after( repos.length, function() {
        pulls.list = allNewPulls;
        pulls.save();
        
        logger.info( 'Done with searching, for now...' );
      
        setTimeout( start, config.app.interval );
      });
    
      // For each repository, get the pull requests
      repos.forEach( function( r ) {
        reviewer.getAllPulls( org, r.name, function( ps ) {
          
          // Calculate the pulls that need to be reviewed.
          if ( ps !== null && ps.length > 0 ) {
            var updatedPs = pulls.update( ps );
          
            // Once all the pull for this repository are polled.
            if ( updatedPs.length > 0 ) {
              var doneWithPulls = _.after( updatedPs.length, function() {
                doneWithRepo();
              });
          
              updatedPs.forEach( function( p ) {
                logger.info( 'Reviewing: ' + p.html_url );
                
                reviewer.getPullRequestDetails( p.html_url, function( details ) {
                  reviewer.review( p.html_url, p.head.sha, p.base.sha, function( fail ) {
                    doneWithPulls();
                  });
                });
              });
            } else {
              doneWithRepo();
            }
        
            allNewPulls = allNewPulls.concat( ps );
          } else {
            doneWithRepo();
          }
        });
      });
    } else {
      setTimeout( start, config.app.interval );
    }
    
  });
}

// Setup the directories if they are not there. This is done just once.
logger.setupDirectory();

if ( config.app.mode.current != config.app.mode.TESTING ) {
  logger.info( 'Review Ninja is up and kicking...(' + config.app.mode.current + ')' );
  
  // Pulls request model
  var pulls = require( __dirname + '/models/Pulls');
  pulls.load( function() {
    start();
  });
} else {
  logger.info( 'Review Ninja is in testing mode...' );
  
  // Diff service
  var parse = require('parse-diff');
  
  // Underscore library
  var _ = require( 'underscore' );
  
  // Set the commenter
  reviewer.commenter = require( __dirname + '/services/ConsoleCommenter' );
  
  var url = 'https://github.com/RIKSOF/yayvo/pull/556';
  
  reviewer.getPullRequestDetails( url, function( details ) {
    reviewer.review( url, details.head.sha, details.base.sha, function( fail ) {
      logger.info( 'Done with reviewing!' );
    });
  });
}