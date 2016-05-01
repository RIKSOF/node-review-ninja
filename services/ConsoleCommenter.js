'use strict';

/**
 * @author Copyright RIKSOF (Private) Limited 2016.
 *
 * @file Console Commenter service - Prints comment to console.
 */

var commenter = {};

// Our logger for logging to file and console
var logger = require( __dirname + '/../services/Logger' );

/**
 * Post comments to a pull request
 *
 * @param {string} url          URL for pull request.
 * @param {Comment} comments    Array of comments.
 * @param {function} callback   Callback once comments are posted.
 *
 * @returns {undefined}
 */
commenter.comment = function ConsoleCommenterComment( url, comments, callback ) {
  logger.info( url + '\n' + JSON.stringify( comments ) );
  callback();
};

/**
 * Post comments to the whole pull request
 *
 * @param {string} url            URL for pull request.
 * @param {Comment} comment       Single comment
 * @param {function} callback     Callback once comments are posted.
 *
 * @returns {undefined}
 */
commenter.commentOnIssue = function ConsoleCommenterCommentOnIssue( url, comment, callback ) {
  logger.info( url + '\n' + JSON.stringify( comment ) );
  callback();
};

// Make the module available to all
module.exports = commenter;