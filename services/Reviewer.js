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
  require( __dirname + '/../reviewers/ESLINTChecker' ),
  require( __dirname + '/../reviewers/JavaCheckStyleChecker' )
];

/**
 * Perform review of a pull request!
 *
 * @param {string} url           Pull request URL.
 * @param {string} commit_id     Commit id
 * @param {string} base_id       Commit id for base branch.
 * @param {Commenter} commenter  Commenter module for sending comments.
 * @callback callback            Callback once reviewed.
 *
 * @returns {undefined}
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
 * @param {string} url                  URL of the pull request.
 * @param {Array.Checker} validators    Array of validators for this file.
 * @param {string} file                 File to be reviewed.
 * @param {string} head_id              Commit id for the head branch.
 * @param {string} base_id              Commit id for base branch.
 * @callback fileProcessed              Callback that is invoked when we complete
 *                                      processing a file.
 *
 * @returns {undefined}
 */
reviewer.startReviewingFile = function( url, validators, file, head_id, base_id,  fileProcessed ) {
  var baseSource = '';
  var headSource = '';
  
  var filesDownloaded = _.after( 2, function() {
    var allValidatorsStarted = _.after( validators.length, function doneFileProcessing() {
      // We are done processing.
      fileProcessed();
    });
    
    validators.forEach( function( v ) {
      v.start( file.from, baseSource, file.to, headSource, function doneStartFile() {
        allValidatorsStarted();
      });
    });
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
 * @param {string} url              URL of the pull request.
 * @param {Array.Checker} checkers  Array of checkers.
 * @param {string} file             File to be reviewed.
 * @param {string} commit_id        Commit ID
 * @param {string} base_commit_id   Base Commit ID
 * @callback fileProcessed          Callback that is invoked when we complete
 *                                  processing a file.
 *
 * @returns {undefined}
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
 * @param {string} url              URL of the pull request.
 * @param {Array.Checker} checkers  Array of validators.
 * @param {object} chunk            Chunk of changes.
 * @param {string} commit_id        Commit ID.
 * @param {string} path             Path of file being changed.
 * @param {number} position         Diff position in current file.
 * @callback chunkProcessed         Callback once this chunk is processed.
 *
 * @returns {number} Updated position in current chunk.
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
 * @param {Array.Checker} checkers  Array of checkers.
 *
 * @returns {undefined}
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
 * @param {string} url              URL of the pull request.
 * @param {Array.Checker} checkers  Checkers to review the code.
 * @callback callback               Callback to call once everything is done.
 *
 * @returns {undefined}
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
 * @param {string} org      Organization
 * @callback callback       Callback once response is received.
 *
 * @returns {undefined}
 */
reviewer.getRepositories = function( org, callback ) {
  github.getRepositories( org, callback );
};

/**
 * Get the list of all pulls for a repository.
 * 
 * @param {string} org        Organization
 * @param {string} repo       Repository
 * @callback callback         Callback once response is received.
 *
 * @returns {undefined}
 */
reviewer.getAllPulls = function( org, repo, callback ) {
  github.getAllPulls( org, repo, callback );
};

/**
 * Get the pull request details
 *
 * @param {string} url       URL for pull request.
 * @callback callback        Callback once response is received.
 *
 * @returns {undefined}
 */
reviewer.getPullRequestDetails = function ( url, callback ) {
  github.getPullRequestDetails( url, callback );
};
   
// Make the module available to all
module.exports = reviewer;