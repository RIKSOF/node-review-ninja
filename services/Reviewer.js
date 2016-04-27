/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Reviewer service
 */

reviewer = {
  commenter: null
};

// Get the configurations
var config = require( __dirname + '/../config' );

// Our logger for logging to file and console
var logger = require( __dirname + '/../services/Logger' );

// Setup git token.
var github = require( __dirname + '/../services/GitHub' );
github.setup( config.github.personalToken );

// Underscore library
var _ = require( 'underscore' );

// Checkers
var ninjas = [
  require( __dirname + '/../reviewers/TabsChecker' ),
  require( __dirname + '/../reviewers/GrammarChecker' ),
  require( __dirname + '/../reviewers/SaneLengthChecker' ),
  require( __dirname + '/../reviewers/JSCSChecker' )
];

/**
 * Perform review of a pull request!
 *
 * @param url       Pull request URL.
 * @param commit_id Commit id
 * @param base_id   Commit id for base branch.
 * @param commenter Commenter module for sending comments.
 * @param callback  Callback once reviewed.
 */
reviewer.review = function ( url, commit_id, base_id, callback ) {
  
  // Diff service
  var parse = require('parse-diff');
  
  github.getDiff( url, function(err, res) {
    if ( err ) {
      logger.error( err );
    } else {
      
      // Initialize all the checkers.
      var checkers = [];
      for ( i = 0; i < ninjas.length; i++ ) {
        checkers.push( new ninjas[i]() );
      }
      
      // Step 1: Reset all checkers
      reviewer.resetCheckers( checkers );
      
      // Step 2: Parse through all changes in the diff.
      var files = parse( res );
      
      // Step 3: Go through the files and check differences in each
      // All files are prcessed. This implies the pull request
      // has been fully reviewed. We will now let all the
      // validators know. Some checkers will spend significant
      // time completing this. So we wait for them to complete.
      var fileProcessed = _.after( files.length, function() {
        reviewer.reviewCompleted( url, checkers, callback );
      });
      
      files.forEach( function( file ) {
        reviewer.reviewFile( url, checkers, file, commit_id, base_id, fileProcessed );
      });
    }
  });
};

/**
 * Start reviewing file.
 *
 * @param url             URL of the pull request.
 * @param validators      Array of validators for this file.
 * @param file            File to be reviewed.
 * @param head_id         Commit id for the head branch.
 * @param base_id         Commit id for base branch.
 * @param fileProcessed   Callback that is invoked when we complete
 *                        processing a file.
 */
reviewer.startReviewingFile = function( url, validators, file, head_id, base_id,  fileProcessed ) {
  var baseSource = '';
  var headSource = '';
  
  var filesDownloaded = _.after( 2, function() {
    validators.forEach( function( v ) {
      v.start( file.from, baseSource, file.to, headSource );
    });
    
    // We are done processing.
    fileProcessed();
  });
  
  // Get the source for base commit.
  github.getContent( url, file.from, base_id, function( res ) {
    
    // Some files will not exist in the base commit.
    if ( res && res.content ) {
      var buf = new Buffer( res.content, 'base64').toString("ascii");
      baseSource = buf;
    }
    
    filesDownloaded();
  });
  
  // Get the source for head commit
  github.getContent( url, file.to, head_id, function( res ) {
    
    // Some files will not exist in the head commit.
    if ( res && res.content ) {
      var buf = new Buffer( res.content, 'base64').toString("ascii");
      headSource = buf;
    }
    
    filesDownloaded();
  });
};      

/**
 * Review a single file.
 *
 * @param url             URL of the pull request.
 * @param checkers        Array of checkers.
 * @param file            File to be reviewed.
 * @param commit_id       Commit ID
 * @param base_commit_id  Base Commit ID
 * @param fileProcessed   Callback that is invoked when we complete
 *                        processing a file.
 */
reviewer.reviewFile = function( url, checkers, file, commit_id, base_commit_id, fileProcessed ) {
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
    
    // Download the version of this file from base and head branches.
    reviewer.startReviewingFile( url, validators, file, commit_id, base_commit_id, function() {
      file.chunks.forEach( function( chunk ) {
        position = reviewer.reviewChunk( url, validators, chunk, commit_id, path, 
          position, chunkProcessed );
      });
    });
    
  } else {
    fileProcessed();
  }
};

/**
 * Review a single chunk.
 *
 * @param url             URL of the pull request.
 * @param checkers        Array of validators.
 * @param chunk           Chunk of changes.
 * @param commit_id       Commit ID.
 * @param path            Path of file being changed.
 * @param position        Diff position in current file.
 * @param chunkProcessed  Callback once this chunk is processed.
 *
 * @return                Updated position in current chunk.
 */
reviewer.reviewChunk = function( url, validators, chunk, commit_id, path, position, chunkProcessed ) {
  
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
          reviewer.commenter.comment( url, comments, function() {} );
        }
        
        linesProcessed();
      });
    
      if ( validators.length > 0 ) {
        validators.forEach( function( c ) {
          c.step( chng, pth, pos, function( body ) {
            if ( body !== '' ) {
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
  
  return position;
};

/**
 * Reset all the given checkers.
 *
 * @param checkers  Array of checkers.
 */
reviewer.resetCheckers = function( checkers ) {
  checkers.forEach( function( c ) {
    c.reset();
  });
};

/**
 * This function is trigerred once the whole pull
 * request has been reviewed. We make a final comment
 * on the pull request.
 *
 * @param url       URL of the pull request.
 * @param checkers  Checkers to review the code.
 * @param callback  Callback to call once everything is done.
 */
reviewer.reviewCompleted = function( url, checkers, callback ) {
  var pullLevelComments = 'I have reviewed this request. Reviewer must review my comments. ';
        
  var allDone = _.after( checkers.length, function() {
    
    // Make one comment for the whole pull request.
    if( pullLevelComments !== '' ) {
      var comment = {
        body: pullLevelComments
      };
            
      reviewer.commenter.commentOnIssue( url, comment, function() {});
    }
    
    callback();
  });
        
  // Do final checks for this pull request.
  checkers.forEach( function( c ) {
    c.done( function( body ) {
      if ( body !== '' ) {
        pullLevelComments += body + ' ';
      }
            
      allDone();
    });
  });
};

/**
 * Get the list of all repositories.
 * 
 * @param org       Organization
 * @param callback  Callback once response is received.
 */
reviewer.getRepositories = function( org, callback ) {
  github.getRepositories( org, callback );
};

/**
 * Get the list of all pulls for a repository.
 * 
 * @param org       Organization
 * @param repo      Repository
 * @param callback  Callback once response is received.
 */
reviewer.getAllPulls = function( org, repo, callback ) {
  github.getAllPulls( org, repo, callback );
};

/**
 * Get the pull request details
 *
 * @param url       URL for pull request.
 * @param callback  Callback once response is received.
 */
reviewer.getPullRequestDetails = function ( url, callback ) {
  github.getPullRequestDetails( url, callback );
};
   
// Make the module available to all
module.exports = reviewer;