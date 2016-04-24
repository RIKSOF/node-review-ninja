/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Commenter service
 */

commenter = {};

// Our logger for logging to file and console
var logger = require( __dirname + '/../services/Logger' );

// Setup git token.
var github = require( __dirname + '/../services/GitHub' );
github.setup( config.github.personalToken );

/**
 * Post comments to a pull request
 *
 * @param url       URL for pull request.
 * @param comments  Array of comments.
 * @param callback  Callback once comments are posted.
 */
commenter.comment = function ( url, comments, callback ) {
  // Once all comments are posted.
  var posted = _.after( comments.length, function() {
    callback();
  });
  
  comments.forEach( function( c ) {
    github.commentOnPull( url, c, function(err, res) {
      if ( err ) {
        logger.error( err );
      }

      posted();
    });
  });
};

/**
 * Post comments to the whole pull request
 *
 * @param url       URL for pull request.
 * @param comment   Single comment
 * @param callback  Callback once comments are posted.
 */
commenter.commentOnIssue = function ( url, comment, callback ) {
  github.commentOnIssue( url, comment, function(err, res) {
    if ( err ) {
      logger.error( err );
    }
    callback();
  });
};

// Make the module available to all
module.exports = commenter;