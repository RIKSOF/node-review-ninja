/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Reviewer service
 */

reviewer = {}

// Checkers
var checkers = [
  require( __dirname + '/../reviewers/TabsChecker' ),
  require( __dirname + '/../reviewers/GrammarChecker' ),
]

/**
 * Perform review of a pull request!
 *
 * @param url       Pull request URL.
 * @param callback  Callback once reviewed.
 */
reviewer.review = function ( url, callback ) {
  
  // Underscore library
  var _ = require( 'underscore' );
  
  // Get the configurations
  var config = require( __dirname + '/../config' );

  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  
  // Get the configurations
  var config = require( __dirname + '/../config' );

  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  
  // Setup git token.
  var github = require( __dirname + '/../services/GitHub' );
  github.setup( config.github.personalToken );

  // Diff service
  var parse = require('parse-diff');
  
  github.getDiff( url, function(err, res) {
    if ( err ) {
      logger.error( err );
    } else {
      
      // Comments on this pull request.
      var commit_id = '4d4f0388440da8a51d0cf68a5f8a85b0db0962ca';
      
      // Reset checkers for this pull request.
      checkers.forEach( function( c ) {
        c.reset();
      });
      
      // Parse through all changes in the diff.
      var files = parse( res );
      var fileProcessed = _.after( files.length, function() {
        callback( true );
      });
      
      files.forEach( function( file ) {
      
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
          
          file.chunks.forEach( function( chunk ) {
          
            // Track when a line is processed.
            var linesProcessed = _.after( chunk.changes.length, function() {
              chunkProcessed();
            });
          
            chunk.changes.forEach( function( change ) {
          
              // Each line is a line :)
              position++;
            
              // Test against all validators
              ( function ( chng, pth, pos, cid ) {
                var comments = [];
                var done = _.after( validators.length, function() {
                  
                  if ( comments.length > 0 ) {
                    // Post these comments to git
                    console.log( JSON.stringify(comments) );
                  }
                  
                  linesProcessed();
                })
              
                if ( validators.length > 0 ) {
                  validators.forEach( function( c ) {
                    c.step( chng, pth, pos, function( body ) {
                      if ( body != '' ) {
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
          });
        } else {
          fileProcessed();
        }
      });
    }
  });
}
   
// Make the module available to all
module.exports = reviewer;