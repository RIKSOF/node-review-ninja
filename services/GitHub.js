'use strict';

/**
 * @author Copyright RIKSOF (Private) Limited 2016.
 *
 * @file GitHub service
 */
var github = {
  userPosition: 1,
  repoPosition: 2,
  pullNumberPosition: 4
};

/**
 * Setup the connection.
 *
 * @param {string} token        User token.
 *
 * @returns {undefined}
 */
github.setup = function GithubSetup( token ) {
  var GitHubApi = require("github");
  var config = require( __dirname + '/../config' );
  
  github.diffapi = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: false,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    pathPrefix: "", // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
      "user-agent": "My-Cool-GitHub-App", // GitHub is happy with a unique user agent,
      "Accept": "application/vnd.github.diff"
    }
  });
  
  github.diffapi.authenticate({
      type: "oauth",
      token: token
  });
  
  github.api = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: false,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    pathPrefix: "", // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
      "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent,
    }
  });
  
  github.api.authenticate({
      type: "oauth",
      token: token
  });
};

/**
 * Get the diff for this pull request.
 *
 * @param {string} u            URL for request.
 * @param {function} callback   Once the request completes.
 *
 * @retruns {undefined}
 */
github.getDiff = function GithubDiff( u, callback ) {
  var url = require('url');
  var decoded = url.parse( u );
  var values = decoded.path.split( '/' );
  
  github.diffapi.pullRequests.get({ 
    user: values[github.userPosition],
    repo: values[github.repoPosition],
    number: values[github.pullNumberPosition]
  }, callback );
};

/**
 * Get pull request details
 *
 * @param {string} u            URL for pull request.
 * @param {function} callback   Callback once response is received.
 *
 * @returns {undefined}
 */
github.getPullRequestDetails = function GithubPullRequestDetails( u, callback ) {
  var url = require('url');
  var decoded = url.parse( u );
  var values = decoded.path.split( '/' );
  
  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  
  github.api.pullRequests.get({
    user: values[github.userPosition],
    repo: values[github.repoPosition],
    number: values[github.pullNumberPosition]
  }, function GithubPullResponse( err, res ) {
    if ( err ) {
      logger.error( err );
    }
   
    callback( eval( res ));
  });
};

/**
 * Comment on a pull request.
 *
 * @param {string} u            URL for request.
 * @param {Comment} comment     Comment
 * @param {function} callback   Once the request completes.
 *
 * @returns {undefined}
 */
github.commentOnPull = function GithubCommentOnPull( u, comment, callback ) {
  var url = require('url');
  var decoded = url.parse( u );
  var values = decoded.path.split( '/' );
  
  comment.user = values[github.userPosition];
  comment.repo = values[github.repoPosition];
  comment.number = values[github.pullNumberPosition];
  
  github.api.pullRequests.createComment( comment, callback );
};

/**
 * Comment on an issue.
 *
 * @param {string} u            URL for the issue.
 * @param {Comment} comment     Comment
 * @param {function} callback   Once the request completes.
 *
 * @returns {undefined}
 */
github.commentOnIssue = function GithubCommentOnIssue( u, comment, callback ) {
  var url = require('url');
  var decoded = url.parse( u );
  var values = decoded.path.split( '/' );
  
  comment.user = values[github.userPosition];
  comment.repo = values[github.repoPosition];
  comment.number = values[github.pullNumberPosition];
  
  github.api.issues.createComment( comment, callback );
};

/**
 * Get repositories
 *
 * @param {string} org          Organization.
 * @param {function} callback   Callback once response is received.
 *
 * @returns {undefined}
 */
github.getRepositories = function GithubGetRepository( org, callback ) {
  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  
  github.api.repos.getFromOrg({
    org: org
  }, function GithubRepositoryResponse( err, res ) {
    if ( err ) {
      logger.error( err );
    }
   
    callback( eval( res ));
  });
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
github.getAllPulls = function GithubAllPulls( org, repo, callback ) {
  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  
  github.api.pullRequests.getAll({
    user: org,
    repo: repo
  }, function GithubAllPullsResponse( err, res ) {
    if ( err ) {
      logger.error( err );
    }
   
    callback( eval( res ));
  });
};

/**
 * Get content of a file.
 *
 * @param {string} u            URL of pull request
 * @param {string} path         Path to file
 * @param {string} commit_id    ID of commit
 * @param {function} callback   Callback when done.
 *
 * @returns {undefined}
 */
github.getContent = function GithubGetContent( u, path, commit_id, callback ) {
  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  var url = require('url');
  var decoded = url.parse( u );
  var values = decoded.path.split( '/' );
  
  github.api.repos.getContent({
    user: values[github.userPosition],
    repo: values[github.repoPosition],
    path: path,
    ref: commit_id
  }, function GitubContentResponse( err, res ) {
    if ( err ) {
      logger.error( err );
    }
   
    callback( eval( res ) );
  });
};


/**
 * Function gets all the comments on a pull request.
 *
 * @param {string} u            URL of the pull request.
 * @param {function} callback   Callback function once response is received.
 *
 * @returns {undefined}
 */
github.getComments = function GithubGetComments( u, callback ) {
  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  var url = require('url');
  var decoded = url.parse( u );
  var values = decoded.path.split( '/' );
  var page = 1;
  var perPage = 100;
  var allComments = [];
  
  // Function for making requests for comments.
  var getCommentsForPage = function GithubGetCommentsPage( ) {
    github.api.pullRequests.getComments({
      user: values[github.userPosition],
      repo: values[github.repoPosition],
      number: values[github.pullNumberPosition],
      page: page,
      per_page: perPage
    }, function( err, res ) {
      
      if ( err ) {
        logger.error( err );
      } else {
        var temp = eval( res );
        allComments = allComments.concat( temp );
        
        // If we have more comments to get, go to next page.
        if ( temp.length >= perPage ) {
          page++;
          getCommentsForPage();
        } else {
          callback( allComments );
        }
      }
    });
  };
  
  // Get all the comments.
  getCommentsForPage();
};

// Make the module available to all
module.exports = github;