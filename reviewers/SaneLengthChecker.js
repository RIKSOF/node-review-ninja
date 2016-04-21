/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Sane Length Checker
 */

checker = {
  lineChangeLimit: 500,
  fileLineLimit: 1000,
  linesCount: 0,
  fileNames: '',
  
  /**
   * Function is used to reset the checker for next pull review.
   */
  reset: function(  ) {
    checker.linesCount = 0;
    checker.fileNames = '';
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param file   Relative path of file.
  */
  doesValidate: function( file ) {
    var validates = true;
    var excluded = [ '.html', '.xib' ];
    
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
   * @param callback    Once processing is done.
   */
  step: function( change, path, position, callback ) {
    var comment = '';
    
    // We will count the lines added and removed.
    if ( change.add || change.del ) {
      checker.linesCount++;
    }
    
    // If a file has gone beyond the line limit
    if ( change.ln > checker.fileLineLimit ||
         change.ln1 > checker.fileLineLimit ||
         change.ln2 > checker.fileLineLimit ) {
      if ( checker.fileNames.indexOf( path ) < 0 ) {
        checker.fileNames += path + ' ';
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
    var comment = '';
    
    if ( checker.linesCount > checker.lineChangeLimit ) {
      comment += 'Please reduce the number of changes in this pull request by breaking it down. ';
    }
    
    if ( checker.fileNames != '' ) {
      comment += 'Please reduce the number of lines in these files, by breaking them down: ' 
        + checker.fileNames;
    }
    
    callback( comment );
  }
}

// Make the module available to all
module.exports = checker;