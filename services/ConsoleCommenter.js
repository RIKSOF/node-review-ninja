/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Console Commenter service - Prints comment to console.
 */

commenter = {};

// Our logger for logging to file and console
var logger = require( __dirname + '/../services/Logger' );

/**
 * Post comments to a pull request
 *
 * @param url       URL for pull request.
 * @param comments  Array of comments.
 * @param callback  Callback once comments are posted.
 */
commenter.comment = function ( url, comments, callback ) {
  logger.info( url + '\n' + JSON.stringify( comments ) );
  callback();
};

/**
 * Post comments to the whole pull request
 *
 * @param url       URL for pull request.
 * @param comment   Single comment
 * @param callback  Callback once comments are posted.
 */
commenter.commentOnIssue = function ( url, comment, callback ) {
  logger.info( url + '\n' + JSON.stringify( comment ) );
  callback();
};

// Make the module available to all
module.exports = commenter;