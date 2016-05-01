'use strict';

/**
 * @author Copyright RIKSOF (Private) Limited 2016.
 *
 * @file Reviewer service
 */

var reviewer = {
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
  require( __dirname + '/../reviewers/JavaCheckStyleChecker' ),
  require( __dirname + '/../reviewers/TailorChecker' ),
  require( __dirname + '/../reviewers/W3CCssChecker' )
];

/**
 * Perform review of a pull request!
 *
 * @param {string} url           Pull request URL.
 * @param {string} commitID      Commit id
 * @param {string} baseID        Commit id for base branch.
 * @param {function} callback    Callback once reviewed.
 *
 * @returns {undefined}
 */
reviewer.review = function ReviewerReview( url, commitID, baseID, callback ) {
  
  // Diff service
  var parse = require('parse-diff');
  
  github.getDiff( url, function diffResult(err, res) {
    if ( err ) {
      logger.error( err );
    } else {
      
      // Get all the comments already posted on this request.
      github.getComments( url, function getReviewComments( postedComments ) {

        // Initialize all the checkers.
        var checkers = [];
        for ( var i = 0; i < ninjas.length; i++ ) {
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
        var fileProcessed = _.after( files.length, function ReviewerReviewFileProcessed() {
          reviewer.reviewCompleted( url, checkers, callback );
        });
      
        files.forEach( function ReviewerReviewFileIterate( file ) {
          reviewer.reviewFile( url, checkers, file, commitID, baseID, postedComments, fileProcessed );
        });
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
 * @param {string} headID               Commit id for the head branch.
 * @param {string} baseID               Commit id for base branch.
 * @param {function} fileProcessed      Callback that is invoked when we complete
 *                                      processing a file.
 *
 * @returns {undefined}
 */
reviewer.startReviewingFile = function ReviewerStartReviewingFile( url, validators, file, headID, baseID, fileProcessed ) {
  var baseSource = '';
  var headSource = '';
  var filesToDownload = 2;
  
  var filesDownloaded = _.after( filesToDownload, function ReviewerReviewFileDownloadDone() {
    var allValidatorsStarted = _.after( validators.length, function doneFileProcessing() {
      // We are done processing.
      fileProcessed();
    });
    
    validators.forEach( function ReviewerReviewFileValidatorIterate( v ) {
      v.start( file.from, baseSource, file.to, headSource, function doneStartFile() {
        allValidatorsStarted();
      });
    });
  });
  
  // Get the source for base commit.
  github.getContent( url, file.from, baseID, function ReviewerGitGetContentBaseDone( res ) {
    
    // Some files will not exist in the base commit.
    if ( res && res.content ) {
      var buf = new Buffer( res.content, 'base64').toString('ascii');
      baseSource = buf;
    }
    
    filesDownloaded();
  });
  
  // Get the source for head commit
  github.getContent( url, file.to, headID, function ReviewerGitGetContentHeadDone( res ) {
    
    // Some files will not exist in the head commit.
    if ( res && res.content ) {
      var buf = new Buffer( res.content, 'base64').toString('ascii');
      headSource = buf;
    }
    
    filesDownloaded();
  });
};      

/**
 * Review a single file.
 *
 * @param {string} url                    URL of the pull request.
 * @param {Array.Checker} checkers        Array of checkers.
 * @param {string} file                   File to be reviewed.
 * @param {string} commitID               Commit ID
 * @param {string} baseCommitID           Base Commit ID
 * @param {Array.Comment} postedComments  Comments we have already posted and should not post again.
 * @param {function} fileProcessed        Callback that is invoked when we complete
 *                                        processing a file.
 *
 * @returns {undefined}
 */
reviewer.reviewFile = function ReviewerReviewFile( url, checkers, file, commitID, baseCommitID, postedComments, fileProcessed ) {
  // Name of the new file. Refresh the position.
  var path = file.to;
  var position = 0;
  
  // Find all the checkers for this file.
  var validators = [];
  checkers.forEach( function ReviewerReviewCheckerIterate( c ) {
    if ( c.doesValidate( path ) ) {
      validators.push( c );
    }
  });
  
  // Track when all chunks are processed.
  var chunkProcessed = _.after( file.chunks.length, function ReviewerChunkProcessed() {
    fileProcessed();
  });

  // Go through all chunks in the new file.
  if ( file.chunks.length > 0 && validators.length > 0 ) {
    
    // Download the version of this file from base and head branches.
    reviewer.startReviewingFile( url, validators, file, commitID, baseCommitID, function ReviewerReviewFileDone() {
      file.chunks.forEach( function ReviewerReviewChunk( chunk ) {
        position = reviewer.reviewChunk( url, validators, chunk, commitID, path, 
          position, postedComments, chunkProcessed );
      });
    });
    
  } else {
    fileProcessed();
  }
};

/**
 * Review a single chunk.
 *
 * @param {string} url                    URL of the pull request.
 * @param {Array.Checker} validators      Array of validators.
 * @param {object} chunk                  Chunk of changes.
 * @param {string} commitID               Commit ID.
 * @param {string} path                   Path of file being changed.
 * @param {number} position               Diff position in current file.
 * @param {Array.Comment} postedComments  Comments we have already posted and should not post again.
 * @param {function} chunkProcessed       Callback once this chunk is processed.
 *
 * @returns {number} Updated position in current chunk.
 */
reviewer.reviewChunk = function ReviewerReviewChunk( url, validators, chunk, commitID, path, position, postedComments, chunkProcessed ) {
  var CommentFilter = require( __dirname + '/../services/CommentFilter' );
  var filter = new CommentFilter();
   
  // Track when a line is processed.
  var linesProcessed = _.after( chunk.changes.length, function ReviewerReviewLineProcessed() {
    chunkProcessed();
  });

  chunk.changes.forEach( function ReviewerChunkIterate( change ) {
    // Each line that is normal or added is counted
    position++;
    
    // Test against all validators
    ( function ReviewerChunkClosure( chng, pth, pos, cid ) {
      var comments = [];
      var done = _.after( validators.length, function ReviewerValidatorProcessedChunk() {
        
        if ( comments.length > 0 ) {
          comments = filter.filter( comments, postedComments );
          
          // Post these comments to git
          if ( comments.length > 0 ) {
            reviewer.commenter.comment( url, comments, function ReviewerReviewChunkCommentPosted() {} );
          }
        }
        
        linesProcessed();
      });
    
      if ( validators.length > 0 ) {
        validators.forEach( function ReviewerChunkValidatorIterate( c ) {
          c.step( chng, pth, pos, function ReviewerChunkValidatorStepDone( body ) {
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
    
    }) ( change, path, position, commitID );
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
reviewer.resetCheckers = function ReviewerResetCheckers( checkers ) {
  checkers.forEach( function ReviewerResetIterateCheckers( c ) {
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
 * @param {function} callback       Callback to call once everything is done.
 *
 * @returns {undefined}
 */
reviewer.reviewCompleted = function ReviewerReviewCompleted( url, checkers, callback ) {
  var pullLevelComments = 'I have reviewed this request. Reviewer must review my comments. ';
        
  var allDone = _.after( checkers.length, function ReviewerAllDone() {
    
    // Make one comment for the whole pull request.
    if ( pullLevelComments !== '' ) {
      var comment = {
        body: pullLevelComments
      };
            
      reviewer.commenter.commentOnIssue( url, comment, function ReviewerCommentPosted() {});
    }
    
    callback();
  });
        
  // Do final checks for this pull request.
  checkers.forEach( function ReviewerIterateCheckers(c) {
    c.done( function ReviewerCheckerDoneCB(body) {
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
 * @param {string} org          Organization
 * @param {function} callback   Callback once response is received.
 *
 * @returns {undefined}
 */
reviewer.getRepositories = function ReviewerGetRepositories( org, callback ) {
  github.getRepositories( org, callback );
};

/**
 * Get the list of all pulls for a repository.
 * 
 * @param {string} org          Organization
 * @param {string} repo         Repository
 * @param {function} callback   Callback once response is received.
 *
 * @returns {undefined}
 */
reviewer.getAllPulls = function ReviewerGetAllPulls( org, repo, callback ) {
  github.getAllPulls( org, repo, callback );
};

/**
 * Get the pull request details
 *
 * @param {string} url          URL for pull request.
 * @param {function} callback   Callback once response is received.
 *
 * @returns {undefined}
 */
reviewer.getPullRequestDetails = function ReviewerGetPullRequestDetails( url, callback ) {
  github.getPullRequestDetails( url, callback );
};
   
// Make the module available to all
module.exports = reviewer;