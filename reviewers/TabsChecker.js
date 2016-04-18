/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Tabs Checker
 */

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
    var excluded = [ '.pbxproj', '.xib' ];
    
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
    var findTabs = /(\t+)/g;
    var comment = null;
    
    // This checker only worries about changes that were added.
    if ( change.add ) {
      var match = findTabs.exec( change.content );
    
      if ( (( match ) ? match[ 0 ].length : 0) > 0 ) {
        comment = 'Use spaces instead of tabs.';
      }
    }
    
    return comment;
  }
}

// Make the module available to all
module.exports = checker;