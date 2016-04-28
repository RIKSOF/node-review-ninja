/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Sane Length Checker
 */

/**
 * Constructor
 *
 * @class [Checker SaneLengthChecker]
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
   *
   * @returns {undefined}
   */
  reset: function SaneLengthCheckerReset() {
    this.linesCount = 0;
    this.fileNames = '';
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param {string} file   Relative path of file.
   *
   * @returns {undefined}
  */
  doesValidate: function SaneLengthCheckerDoesValidate(file) {
    var validates = true;
    var excluded = ['.html', '.xib', '.pbxproj'];
    
    excluded.forEach( function forEachExcluded( e ) {
      if ( file.substr( -e.length) === e ) {
        validates = false;
      }
    });
    
    return validates;
  },
  
  /**
   * Process a new file both it current and proposed version.
   *
   * @param {string} from         Path of the base file.
   * @param {string} baseSource   Content of the base source file.
   * @param {string} to           Path of the head file.
   * @param {function} callback   Callback method to let everyone know
   *                              we are done.
   *
   * @returns {undefined}
   */
  start: function SaneLengthCheckerStart(from, baseSource, to, headSource, callback) {
    callback();
  },
  
  /**
   * Processes a step in the diff file.
   * 
   * @param {object} change      Line being read
   * @param {string} path        File path
   * @param {number} position    Position in file
   * @param {function} callback  Once processing is done.
   *
   * @returns {undefined}
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
   * @param {function} callback    Once processing is done.
   *
   * @returns {undefined}
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