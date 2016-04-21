/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * List of pulls with their commit IDs.
 */

// Reference to the module to be exported
pulls = module.exports = {};

// Initialize a list of clients.
pulls.list = {};

/**
 * Get details of a pull request based on its IP.
 *
 * @param url  url of the request
 */
pulls.get = function( url ) {
  for ( i = 0; i < pulls.list.length; i++ ) {
    p = pulls.list[i]
    if ( url == p.html_url ) {
      return p;
    }
  }
  
  return null;
}

/**
 * Update or add a new pull's information.
 *
 * @param url       URL of the request
 * @param details   Details of the request.
 */
pulls.set = function( url, details ) {
  for ( i = 0; i < pulls.list.length; i++ ) {
    if ( url == pulls.list[i].html_url ) {
      pulls.list[i] = details;
      return;
    }
  }
  
  // If we are here then this is a new url.
  pulls.list.push( details );
}

/**
 * Get details of all pulls.
 */
pulls.getAll = function( ) {
  return pulls.list;
}

/**
 * Update all pulls
 *
 * @param ps  List of all pull requests
 */
pulls.update = function( ps ) {
  newPulls = []
  
  // Compute the new pulls
  ps.forEach( function( p ) {
    var me = pulls.get( p.html_url );
    
    // If we are seeing this pull request for first time or if it has been updated since then...
    if ( me == null || me.head.sha != p.head.sha ) {
      newPulls.push( p );
    }
  });
  
  return newPulls;
}

/**
 * Save list to file.
 */
pulls.save = function( ) {
  // Get the configurations
  var config = require(__dirname + '/../config');
  
  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  
  var d = JSON.stringify( pulls.list );
  
  // Write this to file.
  var fs = require('fs');
  fs.writeFile( config.app.data, d, function(err) {
    if ( err ) {
      logger.error( err );
    }
  }); 
}

/**
 * Read data from file.
 *
 * @param callback      Once the file is loaded
 */
pulls.load = function( callback ) {
  // Get the configurations
  var config = require(__dirname + '/../config');
  
  // Our logger for logging to file and console
  var logger = require( __dirname + '/../services/Logger' );
  
  var fs = require( 'fs' );
  
  fs.readFile( config.app.data, 'utf8', function (err, data) {
    if (err) {
      logger.error( 'Error: ' + err );
    } else {
      pulls.list = JSON.parse( data );
      //pulls.list[ p.html_url ]
    }
    
    callback();
  });
}
