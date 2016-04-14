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
  
  github.api = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: true,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    pathPrefix: "", // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
      "user-agent": "My-Cool-GitHub-App", // GitHub is happy with a unique user agent,
      "Accept": "application/vnd.github.diff"
    }
  });
  
  github.api.authenticate({
      type: "oauth",
      token: token
  });
}

/**
 * Get the diff for this pull request.
 */
github.getDiff = function ( u, callback ) {
  var url = require('url');
  var decoded = url.parse( u );
  var values = decoded.path.split( '/' );
  
  github.api.pullRequests.get({ 
    user: values[1],
    repo: values[2],
    number: values[4]
  }, callback );
}
   
// Make the logger available to all
module.exports = github;