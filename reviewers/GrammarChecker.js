/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Grammar Checker
 */
String.prototype.splice = function( start, delCount, newSubStr ) {
  return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

checker = {  
  /**
   * Function is used to reset the checker for next pull review.
   */
  reset: function(  ) {
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param file   Relative path of file.
  */
  doesValidate: function( file ) {
    var validates = true;
    var excluded = [ '.pbxproj' ];
    
    excluded.forEach( function( e ) {
      if ( file.substr( -e.length) === e ) {
        validates = false;
      }
    });
    
    return validates;
  },
  
  /**
   * Processes a step in the diff file.
   * 
   * @param change      Line being read
   * @param path        File path
   * @param position    Position in file
   */
  step: function( change, path, position ) {
    var gingerbread = require('gingerbread');
    var comment = null;
    var quotedStrings1 = /[']([@#$%&()a-zA-Z0-9.!?" ]*)[']/g; 
    var quotedStrings2 = /["]([@#$%&()a-zA-Z0-9.!?' ]*)["]/g;
    var quotedStrings = [quotedStrings1, quotedStrings2];
    
    // This checker only worries about changes that were added.
    if ( change.add ) {
      line = change.content;
      
      // Compose a string of all quotes to check against.
      var composedLine = '';
      
      for ( i = 0; i < quotedStrings.length; i++ ) {
        findQuotedStrings = quotedStrings[i];
      
        while ( result = findQuotedStrings.exec( line ) ) {
          (function( composedLine ) {
            gingerbread( composedLine, function (error, text, result, corrections) {
              if ( corrections.length > 0 ) {
                comment = '';
          
                // We should allow case sensitive suggestions only if its a sentence.
                var allowCaseSensitive = false;
                if ( composedLine.indexOf(' ') >= 0 ) {
                  allowCaseSensitive = true;
                }
          
                corrections.forEach( function( c ) {
                  // Ignore a correction if its just case change and we are ignoring case sensitive.
                  // Also ignore spaces for single words.
                  if ( allowCaseSensitive == false && c.text.toLowerCase() == c.correct.toLowerCase().replace(/ /g, '')) {
                  } else if ( c.correct != '' ) {
                    comment += 'For ' + c.text + ' did you mean ' + c.correct + '?';
                  }
                }); 
          
                if ( comment != '' ) {
                  console.log( comment );
                  console.log( change.content );  
                }
              }
            });
          })( result[1] );
        }
      }
    }
    
    return comment;
  }
}

// Make the module available to all
module.exports = checker;