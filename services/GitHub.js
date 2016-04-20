/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * GitHub service
 */

github = {}

/**
 * Setup the connection.
 */
github.setup = function ( token ) {
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
}

/**
 * Get the diff for this pull request.
 *
 * @param u        URL for request.
 * @param callback Once the request completes.
 */
github.getDiff = function ( u, callback ) {
  var url = require('url');
  var decoded = url.parse( u );
  var values = decoded.path.split( '/' );
  
  github.diffapi.pullRequests.get({ 
    user: values[1],
    repo: values[2],
    number: values[4]
  }, callback );
}

/**
 * Get pull request details
 *
 * @param u         URL for pull request.
 * @param callback  Callback once response is received.
 */
github.getPullRequestDetails = function ( u, callback ) {
  var url = require('url');
  var decoded = url.parse( u );
  var values = decoded.path.split( '/' );
  
  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  
  github.api.pullRequests.get({
    user: values[1],
    repo: values[2],
    number: values[4]
  }, function( err, res ) {
    if ( err ) {
      logger.error( err );
    }
   
    callback( eval( res ));
  });
}

/**
 * Comment on a pull request.
 *
 * @param u        URL for request.
 * @param comment  Comment
 * @param callback Once the request completes.
 */
github.commentOnPull = function ( u, comment, callback ) {
  var url = require('url');
  var decoded = url.parse( u );
  var values = decoded.path.split( '/' );
  
  comment.user = values[1];
  comment.repo = values[2];
  comment.number = values[4];
  
  github.api.pullRequests.createComment( comment, callback );
}

/**
 * Get repositories
 *
 * @param org       Organization.
 * @param callback  Callback once response is received.
 */
github.getRepositories = function ( org, callback ) {
  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  
  github.api.repos.getFromOrg({
    org: org
  }, function( err, res ) {
    if ( err ) {
      logger.error( err );
    }
   
    callback( eval( res ));
  });
}

/**
 * Get the list of all pulls for a repository.
 * 
 * @param org       Organization
 * @param repo      Repository
 * @param callback  Callback once response is received.
 */
github.getAllPulls = function ( org, repo, callback ) {
  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  
  github.api.pullRequests.getAll({
    user: org,
    repo: repo
  }, function( err, res ) {
    if ( err ) {
      logger.error( err );
    }
   
    callback( eval( res ));
  });
}

// Make the module available to all
module.exports = github;