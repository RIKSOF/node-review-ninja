/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * JS Hint for linting.
 */

checker = {
  sourceFiles: [],
  sourceId: '',
  destinationId: '',
  
  /**
   * Function is used to reset the checker for next pull review.
   */
  reset: function(  ) {
    checker.sourceFiles = [];
    checker.sourceId = '';
    checker.destinationId = '';
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param file   Relative path of file.
  */
  doesValidate: function( file ) {
    var validates = false;
    var included = [ '.js' ];
    
    included.forEach( function( e ) {
      if ( file.substr( -e.length) === e ) {
        validates = true;
      }
    });
    
    return false;
    //return validates;
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
    var comment = '';
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
    var comment = '';
    
    callback( comment );
  }
}

// Make the module available to all
module.exports = checker;