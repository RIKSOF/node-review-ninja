/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * diff service
 */

diff = {}

/**
 * Get the changes from diff
 */
diff.getChanges = function ( d ) {
  var parse = require('parse-diff');
  var files = parse( d );
  var lines = [];
  
  files.forEach( function( file ) {
    file.chunks.forEach( function( chunk ) {
      chunk.changes.forEach( function( change ) {
        // Changes added
        if ( change.add ) {
           lines.push( change.content );
        }
      });
    });
  });
  
  return lines;
}
   
// Make the logger available to all
module.exports = diff;