/**
 * @author Copyright RIKSOF (Private) Limited 2016.
 *
 * @file Commenter service
 */

commenter = {};

var config = require( __dirname + '/../config' );

// Our logger for logging to file and console
var logger = require( __dirname + '/../services/Logger' );

// Underscore library
var _ = require( 'underscore' );

// Setup git token.
var github = require( __dirname + '/../services/GitHub' );
github.setup( config.github.personalToken );

/**
 * Post comments to a pull request
 *
 * @param {string} url              URL for pull request.
 * @param {Array.Comment} comments  Array of comments.
 * @param {function} callback       Callback once comments are posted.
 *
 * @returns {undefined}
 */
commenter.comment = function CommenterComment( url, comments, callback ) {
  // Once all comments are posted.
  var posted = _.after( comments.length, function() {
    callback();
  });
  
  // Track the comments that have been posted
  var commentToPost = 0;
  
  // The function we will use to make posts.
  var postComment = function fPostComment() {
    github.commentOnPull( url, comments[commentToPost], function(err, res) {
      if ( err ) {
        logger.error( err );
        logger.info( 'Caused by: ' + JSON.stringify( comments[commentToPost] ) );
      } 
      
      commentToPost++;
        
      // If there are more comments to be posted.
      if ( commentToPost < comments.length ) {
        // Post each comment after a break of a few seconds.
        setTimeout( postComment, config.app.commentInterval );
      }
      
      posted();
    });
  };
  
  // Start posting the comments. One comment is posted at a time.
  setTimeout( postComment, config.app.commentInterval );
};

/**
 * Post comments to the whole pull request
 *
 * @param {string} url          URL for pull request.
 * @param {Comment} comment     Single comment
 * @param {function} callback   Callback once comments are posted.
 *
 * @returns {undefined}
 */
commenter.commentOnIssue = function CommenterCommentOnIssue( url, comment, callback ) {
  github.commentOnIssue( url, comment, function CommenterCommentOnIssueResponse(err, res) {
    if ( err ) {
      logger.error( err );
      logger.info( 'Caused by: ' + JSON.stringify( comment ) );
    }
    callback();
  });
};

// Make the module available to all
module.exports = commenter;