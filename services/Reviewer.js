/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Reviewer service
 */

reviewer = {}

// Get the configurations
var config = require( __dirname + '/../config' );

// Our logger for logging to file and console
var logger = require( __dirname + '/../services/Logger' );

// Setup git token.
var github = require( __dirname + '/../services/GitHub' );
github.setup( config.github.personalToken );

/**
 * Perform review of a pull request!
 *
 * @param url       Pull request URL.
 * @param commit_id Commit id
 * @param callback  Callback once reviewed.
 */
reviewer.review = function ( url, commit_id, callback ) {
  
  // Underscore library
  var _ = require( 'underscore' );

  // Diff service
  var parse = require('parse-diff');
  
  // Checkers
  var checkers = [
    require( __dirname + '/../reviewers/TabsChecker' ),
    require( __dirname + '/../reviewers/GrammarChecker' ),
    require( __dirname + '/../reviewers/SaneLengthChecker' )
  ]
  
  github.getDiff( url, function(err, res) {
    if ( err ) {
      logger.error( err );
    } else {
      
      // Reset checkers for this pull request.
      checkers.forEach( function( c ) {
        c.reset();
      });
      
      // Parse through all changes in the diff.
      var files = parse( res );
      
      // All files are prcessed. This implies the pull request
      // has been fully reviewed. We will now let all the
      // validators know. Some checkers will spend significant
      // time completing this. So we wait for them to complete.
      var fileProcessed = _.after( files.length, function() {
        var pullLevelComments = 'I have reviewed this request. Reviewer must review my comments. ';
        
        var allDone = _.after( checkers.length, function() {
          // Make one comment for the whole pull request.
          if( pullLevelComments != '' ) {
            var comments = {
              body: pullLevelComments
            };
            
            reviewer.commentOnIssue( url, comments, function() {
            });
          }
          callback();
        });
        
        // Do final checks for this pull request.
        checkers.forEach( function( c ) {
          c.done( function( body ) {
            if ( body != '' ) {
              pullLevelComments += body + ' ';
            }
            
            allDone();
          });
        });
      });
      
      files.forEach( function( file ) {
      
        // Name of the new file. Refresh the position.
        var path = file.to;
        var position = 0;
        
        // Find all the checkers for this file.
        var validators = [];
        checkers.forEach( function( c ) {
          if ( c.doesValidate( path ) ) {
            validators.push( c );
          }
        });
        
        // Track when all chunks are processed.
        var chunkProcessed = _.after( file.chunks.length, function() {
          fileProcessed();
        });
      
        // Go through all chunks in the new file.
        if ( file.chunks.length > 0 ) {
          
          file.chunks.forEach( function( chunk ) {
          
            // Track when a line is processed.
            var linesProcessed = _.after( chunk.changes.length, function() {
              chunkProcessed();
            });
          
            chunk.changes.forEach( function( change ) {
          
              // Each line that is normal or added is counted
              position++;
              
              // Test against all validators
              ( function ( chng, pth, pos, cid ) {
                var comments = [];
                var done = _.after( validators.length, function() {
                  
                  if ( comments.length > 0 ) {
                    // Post these comments to git
                    reviewer.comment( url, comments, function() {
                    });
                  }
                  
                  linesProcessed();
                })
              
                if ( validators.length > 0 ) {
                  validators.forEach( function( c ) {
                    c.step( chng, pth, pos, function( body ) {
                      if ( body != '' ) {
                        comments.push({
                          body: body,
                          commit_id: cid,
                          path: pth,
                          position: pos
                        });
                      }
                  
                      done();
                    });
                  });
                } else {
                  done();
                }
              
              }) ( change, path, position, commit_id );
            });
          });
        } else {
          fileProcessed();
        }
      });
    }
  });
}

/**
 * Get the list of all repositories.
 * 
 * @param org       Organization
 * @param callback  Callback once response is received.
 */
reviewer.getRepositories = function( org, callback ) {
  github.getRepositories( org, callback );
}

/**
 * Get the list of all pulls for a repository.
 * 
 * @param org       Organization
 * @param repo      Repository
 * @param callback  Callback once response is received.
 */
reviewer.getAllPulls = function( org, repo, callback ) {
  github.getAllPulls( org, repo, callback );
}

/**
 * Get the pull request details
 *
 * @param url       URL for pull request.
 * @param callback  Callback once response is received.
 */
reviewer.getPullRequestDetails = function ( url, callback ) {
  github.getPullRequestDetails( url, callback );
}

/**
 * Post comments to a pull request
 *
 * @param url       URL for pull request.
 * @param comments  Array of comments.
 * @param callback  Callback once comments are posted.
 */
reviewer.comment = function ( url, comments, callback ) {
  
  // Underscore library
  var _ = require( 'underscore' );
  
  // Once all comments are posted.
  var posted = _.after( comments.length, function() {
    callback();
  })
  
  comments.forEach( function( c ) {
    github.commentOnPull( url, c, function(err, res) {
      if ( err ) {
        logger.error( err );
      }

      posted();
    });
  });
}

/**
 * Post comments to the whole pull request
 *
 * @param url       URL for pull request.
 * @param comment   Single comment
 * @param callback  Callback once comments are posted.
 */
reviewer.commentOnIssue = function ( url, comment, callback ) {
  github.commentOnIssue( url, comment, function(err, res) {
    if ( err ) {
      logger.error( err );
    }
    callback();
  });
}
   
// Make the module available to all
module.exports = reviewer;