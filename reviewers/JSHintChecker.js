/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * JS Hint for linting.
 */

checker = {
  lintedFiles: [],
  
  /**
   * Function is used to reset the checker for next pull review.
   */
  reset: function(  ) {
    checker.lintedFiles = [];
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

    return validates;
  },
  
  /**
   * Process a new file both it current and proposed version.
   *
   * @param from        Path of the base file.
   * @param baseSource  Content of the base source file.
   * @param to          Path of the head file.
   * @param headSource  Content of the head source file.
   */
  start: function( from, baseSource, to, headSource ) {
    var jshint = require( 'jshint' );
    var errors = {};
    var data = {};
    
    // Lint the base source.
    jshint.JSHINT( baseSource );
    errors.base = jshint.JSHINT.errors;
    data.base = jshint.JSHINT.data();
    
    // Lint the head source.
    jshint.JSHINT( headSource );
    errors.head = jshint.JSHINT.errors;
    data.head = jshint.JSHINT.data();
    
    // Remember this report.
    var report = {
      file: to,
      errors: errors,
      data: data
    };
    
    checker.lintedFiles.push( report );
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
    
    // On the line, only report on changes that were made.
    if ( change.add ) {
      checker.lintedFiles.forEach( function ( f ) {
        if ( f.file === path ) {
          f.errors.head.forEach( function ( e ) {
            if ( e.line === change.ln ) {
              comment += e.reason + ' ';
            }
          });
        }
      });
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
    callback( comment );
  }
}

// Make the module available to all
module.exports = checker;