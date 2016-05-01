'use strict';

/**
 * @author Copyright RIKSOF (Private) Limited 2016.
 *
 * @file Filtering of comments
 */

// Our logger for logging to file and console
var logger = require( __dirname + '/../services/Logger' );

/**
 * Constructor
 *
 * @class [CommentFilter]
 */
var filter = function CommentFilter() {
};

filter.prototype = {
    
  /**
   * Function is used to filter comments that have already been posted.
   *
   * @param {Array.Comment} toPost          Comments we are planning to post.
   * @param {Array.Comment} alreadyPosted   Comments that have already been posted.
   *
   * @returns {Array.Comment}               Array of comments.
   */
  filter: function CommentFilterFilter( toPost, alreadyPosted ) {
    var filteredPosts = [];
    
    // See if we find comments we intend to post in already posted
    // events.
    for ( var i = 0; i < toPost.length; i++ ) {
      var found = false;
      for ( var j = 0; j < alreadyPosted.length; j++ ) {
        if ( toPost[i].path === alreadyPosted[j].path && toPost[i].position === alreadyPosted[j].position && toPost[i].body === alreadyPosted[j].body ) {
          found = true;
          break;
        }
      }
      
      // If we did not find this comment, then we will post it.
      if ( !found ) {
        filteredPosts.push( toPost[i] );
      }
    }
    
    logger.info( 'Filtered ' + (toPost.length - filteredPosts.length) + ' from ' + toPost.length + ' comments.' );
    
    return filteredPosts;
  }
};

// Make the module available to all
module.exports = filter;