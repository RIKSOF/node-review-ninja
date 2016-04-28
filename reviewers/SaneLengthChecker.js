/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Sane Length Checker
 */

checker = function SaneLengthChecker() {
}

checker.prototype = {
  lineChangeLimit: 500,
  fileLineLimit: 1000,
  linesCount: 0,
  fileNames: '',
  
  /**
   * Function is used to reset the checker for next pull review.
   */
  reset: function SaneLengthCheckerReset() {
    this.linesCount = 0;
    this.fileNames = '';
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param file   Relative path of file.
  */
  doesValidate: function SaneLengthCheckerDoesValidate(file) {
    var validates = true;
    var excluded = ['.html', '.xib', '.pbxproj'];
    
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
   * @callback callback           Callback method to let everyone know
   *                              we are done.
   */
  start: function SaneLengthCheckerStart(from, baseSource, to, headSource, callback) {
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
  step: function SaneLengthCheckerStep(change, path, position, callback) {
    var comment = '';
    
    // We will count the lines added and removed.
    if ( change.add || change.del ) {
      this.linesCount++;
    }
    
    // If a file has gone beyond the line limit
    if ( change.ln > this.fileLineLimit ||
         change.ln1 > this.fileLineLimit ||
         change.ln2 > this.fileLineLimit ) {
      if ( this.fileNames.indexOf( path ) < 0 ) {
        this.fileNames += path + ' ';
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
  done: function SaneLengthCheckerDone(callback) {
    var comment = '';
    
    if ( this.linesCount > this.lineChangeLimit ) {
      comment += '\nPlease reduce the number of changes in this pull request by breaking it down. ';
    }
    
    if ( this.fileNames !== '' ) {
      comment += '\nPlease reduce the number of lines in these files, by breaking them down: *' + this.fileNames + '*';
    }
    
    callback( comment );
  }
};

// Make the module available to all
module.exports = checker;