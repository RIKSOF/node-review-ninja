/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Grammar Checker
 */
String.prototype.splice = function( start, delCount, newSubStr ) {
  return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

checker = function GrammarChecker() {
}

checker.prototype = {
    
  /**
   * Function is used to reset the checker for next pull review.
   */
  reset: function GrammarCheckerReset() {
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param file   Relative path of file.
  */
  doesValidate: function GrammarCheckerDoesValidate(file) {
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
   * Process a new file both it current and proposed version.
   *
   * @param from        Path of the base file.
   * @param baseSource  Content of the base source file.
   * @param to          Path of the head file.
   * @param headSource  Content of the head source file.
   * @callback callback           Callback method to let everyone know
   *                              we are done.
   */
  start: function GrammarCheckerStart( from, baseSource, to, headSource, callback ) {
    callback();
  },
  
  /**
   * Processes a step in the diff file.
   * 
   * @param change      Line being read
   * @param path        File path
   * @param position    Position in file
   * @param callback    Once processing is done.
   */
  step: function GrammarCheckerStep( change, path, position, callback ) {
    var gingerbread = require('gingerbread');
    var comment = '';
    var quotedStrings1 = /[']([@#$%&()a-zA-Z0-9.!?" ]*)[']/g; 
    var quotedStrings2 = /["]([@#$%&()a-zA-Z0-9.!?' ]*)["]/g;
    var quotedStrings = [quotedStrings1, quotedStrings2];
    
    // This checker only worries about changes that were added.
    if ( change.add ) {
      line = change.content;
      
      // Compose a string of all quotes to check against.
      var composedLine = '';
      
      // Make sure we send the comments just once per call.
      var count = 0;
      var done = false;
      var nothingToDo = true;
      
      for ( i = 0; i < quotedStrings.length; i++ ) {
        findQuotedStrings = quotedStrings[i];
      
        while ( result = findQuotedStrings.exec( line ) ) {
          nothingToDo = false;
          
          (function( composedLine ) {
            count++;
            
            gingerbread( composedLine, function (error, text, result, corrections) {
              count--;
              
              if ( corrections && corrections.length > 0 ) {
                
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
                    comment += 'For `' + c.text + '` did you mean `' + c.correct + '`? ';
                  }
                });
              }
              
              if ( done && count <= 0 ) {
                callback( comment );
              }
            });
          })( result[1] );
        }
      }
      
      // We are done!
      done = true;
      
      // If we had nothing to do, then send empty comments.
      if ( nothingToDo ) {
        callback( comment );
      }
      
    } else {
      // No comment on this line
      callback( comment );
    }
  },
  
  /**
   * This event indicates the current pull request diff is completed.
   * It gives checker the opportunity to make a comment to the full
   * diff.
   * 
   * @param callback    Once processing is done.
   */
  done: function GrammarCheckerDone( callback ) {
    callback( '' );
  } 
}

// Make the module available to all
module.exports = checker;