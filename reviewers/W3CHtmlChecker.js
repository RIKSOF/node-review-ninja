'use strict';

/**
 * @author Copyright RIKSOF (Private) Limited 2016.
 *
 * @file W3C Checker for HTML.
 */

// Our logger for logging to file and console
var logger = require( __dirname + '/../services/Logger' );

// Underscore library
var _ = require( 'underscore' );

/**
 * Constructor
 *
 * @class [Checker W3CHtmlChecker]
 */
var checker = function W3CHtmlChecker() {
  
  /**
   * Array of file paths.
   */
  this.checkedFiles = [];
};

checker.prototype = {
  
  SEVERITY_HIGH: 'error',
  SEVERITY_MEDIUM: '',
  SEVERITY_WARN: 'info',
  
  /**
   * Function is used to reset the checker for next pull review.
   *
   * @return {undefined}
   */
  reset: function W3CHtmlCheckerReset() {
    this.checkedFiles = [];
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param {string} file   Relative path of file.
   * @returns {boolean}     If this checker validates given file.
   */
  doesValidate: function W3CHtmlCheckerDoesValidate( file ) {
    var validates = false;
    var included = ['.html'];
    
    included.forEach( function eachInclude( e ) {
      if ( file.substr( -e.length) === e ) {
        validates = true;
      }
    });

    return validates;
  },
  
 /**
  * Process a new file to find issues in it. Those issues are reported to
  * the callback in an array.
  *
  * @param {string} path         Path of the file.
  * @param {string} source       Content of the source file.
  * @param {function} callback   Callback method to let everyone know
  *                              we are done.
  *
  * @return {undefined}
  */
  processFile: function W3CHtmlCheckerProcessFile( path, source, callback ) {
    var me = this;
    var htmlValidator = require('html-validator');
    var errors = [];
    
    var params = {
      data: source
    };
    
    // Validate the given html.
    htmlValidator( params, function W3CHtmlCheckerValidate( err, data ) {
      if ( err ) {
        logger.error( err );
        logger.info( 'Error caused by source: ' + source );
      } else {
        
        // Gather validation errors.
        var json = JSON.parse( data );
        json.messages.forEach( function eachError( e ) {
          var error = {
            severity: e.type,
            file: path,
            line: parseInt(e.firstLine),
            message: e.message,
            source: e.extract
          };
          
          errors.push( error );
        });
      }
      
      // Let the caller know about the errors.
      callback( errors );

    });
  },
  
  /**
   * Process a new file both its current and proposed version.
   *
   * @param {string} from         Path of the base file.
   * @param {string} baseSource   Content of the base source file.
   * @param {string} to           Path of the head file.
   * @param {string} headSource   Content of the head source file.
   * @param {function} callback   Callback method to let everyone know
   *                              we are done.
   *
   * @return {undefined}
   */
  start: function W3CHtmlCheckerStart( from, baseSource, to, headSource, callback ) {
    var filesToCompare = 2;
    var me = this;
    var errors = {
      head: [],
      base: []
    };
    
    // Once everythins is done, finish off with this.
    var allDone = _.after( filesToCompare, function W3CHtmlCheckerFileDone() {
      // Remember this report.
      var report = {
        file: to,
        errors: errors
      };
      
      me.checkedFiles.push( report );
      callback();
    }); 
    
    // Review the base source code
    this.processFile( from, baseSource, function W3CHtmlCheckerBaseSourceErrors( errs ) {
      errors.base = errs;
      allDone();
    });
    
    // Review the head source code.
    this.processFile( to, headSource, function W3CHtmlCheckerHeadSourceErrors( errs ) {
      errors.head = errs;
      allDone();
    });
  },
  
  /**
   * Processes a step in the diff file.
   * 
   * @param {Object} change       Line being read
   * @param {string} path         File path
   * @param {number} position     Position in file
   * @param {function} callback   Once processing is done.
   *
   * @return {undefined}
   */
  step: function W3CHtmlCheckerStep( change, path, position, callback ) {
    var comment = '';
    
    // On the line, only report on changes that were made.
    if ( change.add ) {
      for ( var j = 0; j < this.checkedFiles.length; j++ ) {
        var f = this.checkedFiles[j]; 
        if ( f.file === path ) {
          for ( var i = 0; i < f.errors.head.length; i++ ) {
            if ( f.errors.head[i] !== null && f.errors.head[i].line === change.ln ) {
              if ( comment.length !== 0 ) {
                comment += '\n';
              }
              
              comment += f.errors.head[i].message + '\n```html\n' + f.errors.head[i].extract + '\n```';
              f.errors.head[i].reported = true;
            }
          }
        }
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
   * @return {undefined}
   */
  done: function W3CHtmlCheckerDone( callback ) {
    var comment = '';
    var maxErrorsPerFile = 5;
    
    // Look through all changed files and ensure that we 
    // have not added more errors in this pull.
    for ( var i = 0; i < this.checkedFiles.length; i++ ) {
      var f = this.checkedFiles[i];
      
      // We are only interested if the head branch still has
      // lint issues.
      if ( f.errors.head.length > 0 ) {
        var baseIndex = 0;
        var headIndex = 0;
        
        // We want to limit to no more than 5 comments per file
        var errorsCount = 0;
      
        // Keep searching till we get to the end of the issues
        // on head branch.
        while ( f.errors.head !== null && headIndex < f.errors.head.length && errorsCount < maxErrorsPerFile ) {
          // Make sure the current head error is not a null
          if ( f.errors.head[ headIndex] === null ) {
            headIndex++;
            continue;
          }
          
          // If we still have issues to look at on the base branch.
          if ( f.errors.base !== null && baseIndex < f.errors.base.length ) {
            
            // Make sure the current base error is not a null
            if ( f.errors.base[ baseIndex] === null ) {
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
              if ( !f.errors.head[headIndex].reported && f.errors.head[headIndex].severity !== this.SEVERITY_WARN ) {
                comment += '\n**' + f.file + '(' + f.errors.head[ headIndex ].line + '):** *' + f.errors.head[ headIndex ].message + '*';
                errorsCount++;
              }
              
              headIndex++;
            }
          } else {
            // All these comments are not in the base branch, so they
            // are additional comments. Need to make sure we did not
            // report them in the line by line review.
            if ( !f.errors.head[headIndex].reported && f.errors.head[headIndex].severity !== this.SEVERITY_WARN ) {
              comment += '\n**' + f.file + '(' + f.errors.head[ headIndex ].line + '):** *' + f.errors.head[ headIndex ].message + '*';
              errorsCount++;
            }
            
            headIndex++;
          }
        }
      }
    }
    
    callback( comment );
  }
};

// Make the module available to all
module.exports = checker;