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
          for ( i = 0; i < f.errors.head.length; i++ ) {
            if ( f.errors.head[i].line === change.ln ) {
              console.log( 'Diff: ' + change.content );
              console.log( 'Lint: ' + f.errors.head[i].reason )
              //comment += f.errors.head[i].reason + ' ';
              //f.errors.head[i].reported = true;
            }
          }
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
    
    // Look through all changed files and ensure that we 
    // have not added more errors in this pull. 
    checker.lintedFiles.forEach( function ( f ) {
      
      // We are only interested if the head branch still has
      // lint issues.
      if ( f.errors.head.length > 0 ) {
        baseIndex = 0;
        headIndex = 0;
      
        // Keep searching till we get to the end of the issues
        // on head branch.
        while ( f.errors.head !== null && headIndex < f.errors.head.length ) {
          // Make sure the current head error is not a null
          if ( f.errors.head[ headIndex] === null ) {
            headIndex++;
            continue;
          }
          
          // If we still have issues to look at on the base branch.
          if ( f.errors.base !== null && baseIndex < f.errors.base.length ) {
            
            // Make sure the current base error is not a null
            if ( f.errors.base[ baseIndex] == null ) {
              baseIndex++;
              continue;
            }
            
            // If this error is in both branches. 
            if ( f.errors.base[ baseIndex ].line === f.errors.head[ headIndex ].line ) {
              
              // Ignore this line.
              baseIndex++;
              headIndex++;     
            } else if ( f.errors.base[ baseIndex ].line < f.errors.head[ headIndex ].line ) {
              // Go to the next error as this error has
              // been removed from the head branch.
              baseIndex++;
            } else {
              // All these comments are not in the base branch, so they
              // are additional comments. Need to make sure we did not
              // report them in the line by line review.
              if ( !f.errors.head[headIndex].reported ) {
                comment += f.file + '(' + f.errors.head[ headIndex ].line + '): ' + f.errors.head[ headIndex ].reason + ' ';
              }
              
              headIndex++;
            }
          } else {
            // All these comments are not in the base branch, so they
            // are additional comments. Need to make sure we did not
            // report them in the line by line review.
            if ( !f.errors.head[headIndex].reported ) {
              comment += f.file + '(' + f.errors.head[ headIndex ].line + '): ' + f.errors.head[ headIndex ].reason + ' ';
            
            }
            
            headIndex++;
          }
        }
      }
    });
    
    comment = '';
    
    callback( comment );
  }
}

// Make the module available to all
module.exports = checker;