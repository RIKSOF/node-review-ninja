'use strict';

/**
 * @author Copyright RIKSOF (Private) Limited 2016.
 *
 * @file Tabs Checker
 */

/**
 * Constructor
 *
 * @class [Checker TabsChecker]
 */
var checker = function TabsChecker() {
}

checker.prototype = {
  issuesFound: false,
  
  /**
   * Function is used to reset the checker for next pull review.
   *
   * @returns {undefined}
   */
  reset: function TabsCheckerReset() {
    this.issuesFound = false;
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param {string} file   Relative path of file.
   *
   * @returns {undefined}
  */
  doesValidate: function TabsCheckerDoesValidate( file ) {
    var validates = true;
    var excluded = ['.pbxproj', '.xib', '.js', '.java', '.swift', '.plist'];
    
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
   * @param {string} from         Path of the base file.
   * @param {string} baseSource   Content of the base source file.
   * @param {string} to           Path of the head file.
   * @param {string} headSource   Content of the head source file.
   * @param {function} callback   Callback method to let everyone know
   *                              we are done.
   *
   * @returns {undefined}
   */
  start: function TabsCheckerStart( from, baseSource, to, headSource, callback ) {
    callback();
  },
  
  /**
   * Processes a step in the diff file.
   * 
   * @param {object} change       Line being read
   * @param {string} path         File path
   * @param {number} position     Position in file
   * @param {function} callback   Once processing is done.
   *
   * @returns {undefined}
   */
  step: function TabsCheckerStep( change, path, position, callback ) {
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
   * @param {function} callback    Once processing is done.
   *
   * @returns {undefined}
   */
  done: function TabsCheckerDone( callback ) {
    var comment = this.issuesFound ? '\n**Please do not merge till tabs are removed. **' : '';
    callback( comment );
  } 
};

// Make the module available to all
module.exports = checker;