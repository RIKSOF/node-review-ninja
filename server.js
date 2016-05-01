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

// Pulls that need to be processed.
var pulls = require( __dirname + '/models/Pulls');

// Service data
var data = {
  org: config.github.org,
  allRepos: [],
  pullsInCurrentRepo: [],
  allNewPulls: [],
  currentRepo: -1,
  currentPull: 0
};

/**
 * Function to start a new review cycle.
 *
 * @returns {undefined}
 */
function start() {
  
  // Underscore library
  var _ = require( 'underscore' );
  
  // Set the commenter
  reviewer.commenter = require( __dirname + '/services/Commenter' );

  logger.info( 'Searching for bad pull requests...' );
  
  // The new list of current pulls will be empty in the beginning.
  data.allNewPulls = [];
  
  // Get all repositories
  reviewer.getRepositories( data.org, function getRepos( repos ) {
      
    // Once all the repositories are polled
    if ( repos !== null && repos.length > 0 ) {
      
      // Update our list of repositories
      data.allRepos = repos;
      
      // We are starting afresh
      data.currentRepo = -1;
      
      // Perform next step in the review. Once all repos are reviewed,
      // this callback is called.
      step( function allReposReviewed() {
        pulls.list = data.allNewPulls;
        pulls.save();
        
        logger.info( 'Done with searching, for now...' );
      
        setTimeout( start, config.app.interval );
      });
    } else {
      setTimeout( start, config.app.interval );
    }
  });
}

/**
 * Function perform a step in the review cycle.
 *
 * @param {function} callback     Callback for when the steps complete.
 *
 * @returns {undefined}
 */
function step( callback ) {
  process.stdout.write( '.' );
  
  // First check if we need to progress to the next repository and there are more repositories to review.
  if ( data.currentRepo < 0 || ( data.currentPull + 1 >= data.pullsInCurrentRepo.length && data.currentRepo + 1 < data.allRepos.length )) {
    process.stdout.write( 'O' );
    
    // We move to the next repo.
    data.currentRepo++;
    
    // Get all pull requests for this new repo.
    reviewer.getAllPulls( data.org, data.allRepos[data.currentRepo].name, function fGetAllPulls( ps ) {
      
      // If there are pulls to review in this repo.
      if ( typeof ps !== 'undefined' && ps.length > 0 ) {
        // Just those pulls that need to be reviewed.
        data.pullsInCurrentRepo = pulls.update( ps );
        
        // Update this list to the list of new pulls.
        data.allNewPulls = data.allNewPulls.concat( ps );
      } else {
        data.pullsInCurrentRepo = [];
      }
      
      // We need to start reviewing from first pull.
      data.currentPull = -1;
      
      // Go to next step.
      step( callback );
    });
    
  } else if ( data.currentPull + 1 < data.pullsInCurrentRepo.length ) {

    // Review the next pull request.
    data.currentPull++;
    
    reviewPull( data.pullsInCurrentRepo[data.currentPull], function pullReviewed() {
      step( callback );
    });
  } else {
    // We cannot advance to the next pull request, nor are there more pulls to look at.
    // so this cycle has ended.
    callback();
  }
}

/**
 * Function to trigger a review.
 *
 * @param {object} p            Object with details of the pull request.
 * @param {function} callback   Callback invoked once review is processed.
 *
 * @returns {undefined}
 */
function reviewPull( p, callback ) {
  logger.info( 'Reviewing: ' + p.html_url );
    
  reviewer.getPullRequestDetails( p.html_url, function fGetPullRequestDetails( details ) {
    reviewer.review( p.html_url, p.head.sha, p.base.sha, function fReview( fail ) {
      callback();
    });
  });
}

// Setup the directories if they are not there. This is done just once.
logger.setupDirectory();

if ( config.app.mode.current != config.app.mode.TESTING ) {
  logger.info( 'Review Ninja is up and kicking...(' + config.app.mode.current + ')' );
  
  // Pulls request model
  pulls.load( function fPullLoad() {
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
  
  var url = 'https://github.com/RIKSOF/checout/pull/115';
  
  reviewer.getPullRequestDetails( url, function fTestGetPullRequestDetails( details ) {
    reviewer.review( url, details.head.sha, details.base.sha, function fTestReview( fail ) {
      logger.info( 'Done with reviewing!' );
    });
  });
}