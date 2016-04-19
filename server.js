/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Main Server.
 */

// Get the configurations
var config = require( __dirname + '/config' );

// Our logger for logging to file and console
var logger = require( __dirname + '/services/Logger' );

// Underscore library
var _ = require( 'underscore' );

// Setup the directories if they are not there. This is done just once.
logger.setupDirectory();

// Setup git token.
var github = require( __dirname + '/services/GitHub' );
github.setup( config.github.personalToken );

// Diff service
var parse = require('parse-diff');

// Checkers
var checkers = [
  require( __dirname + '/reviewers/TabsChecker' ),
  require( __dirname + '/reviewers/GrammarChecker' ),
]

var ninja = setInterval( function( ) {
  logger.info( 'Searching for bad pull requests...' );
  
  github.getDiff( 'https://github.com/RIKSOF/yayvo/pull/527', function(err, res) {
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
      
        // Go through all chunks in the new file.
        file.chunks.forEach( function( chunk ) {
          chunk.changes.forEach( function( change ) {
          
            // Each line is a line :)
            position++;
            
            // Test against all validators
            ( function ( chng, pth, pos, cid ) {
              var comments = [];
              var done = _.after( validators.length, function() {
                console.log( JSON.stringify(comments) );
              })
              
              validators.forEach( function( c ) {
                c.step( chng, pth, pos, function( body ) {
                  if ( pos == 420 ) {
                    console.log( '>>>>>>>>>>>' + chng.content );
                  }
                  
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
            }) ( change, path, position, commit_id );
          });
        });
      });
    }
  });
  
  logger.info( 'Done searching!' );
}, config.app.interval );

logger.info( 'Review Ninja is up and kicking...' );
