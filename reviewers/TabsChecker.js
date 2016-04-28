/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Tabs Checker
 */

checker = function() {
}

checker.prototype = {
  issuesFound: false,
  
  /**
   * Function is used to reset the checker for next pull review.
   */
  reset: function(  ) {
    this.issuesFound = false;
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param file   Relative path of file.
  */
  doesValidate: function( file ) {
    var validates = true;
    var excluded = ['.pbxproj', '.xib', '.js'];
    
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
  start: function( from, baseSource, to, headSource, callback ) {
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
  step: function( change, path, position, callback ) {
    var findTabs = /(\t+)/g;
    var comment = '';
    
    // This checker only worries about changes that were added.
    if ( change.add ) {
      var match = findTabs.exec( change.content );
    
      if ( (( match ) ? match[ 0 ].length : 0) > 0 ) {
        comment = 'Use spaces instead of tabs.';
        this.issuesFound = true;
      }
    }
    
    callback( comment );
  },
  
  /**
   * This event indicates the current pull request diff is completed.
   * It gives checker the opportunity to make a comment to the full
   * diff.
   * 
   * @param callback    Once processing is done.
   */
  done: function( callback ) {
    var comment = ( this.issuesFound ) ? '\n**Please do not merge till tabs are removed. **' : '';
    callback( comment );
  } 
}

// Make the module available to all
module.exports = checker;