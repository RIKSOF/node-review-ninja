'use strict';

/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * Java Style Checker.
 */

// Our logger for logging to file and console
var logger = require( __dirname + '/../services/Logger' );

// Underscore library
var _ = require( 'underscore' );

/**
 * Constructor
 *
 * @class [Checker JavaCheckStyleChecker]
 */
var checker = function JavaCheckStyleChecker() {
  
  /**
   * Array of file paths.
   */
  this.checkedFiles = [];
};

checker.prototype = {
  
  SEVERITY_HIGH: 'ERROR',
  SEVERITY_MEDIUM: 2,
  SEVERITY_WARN: 'WARN',
  
  /**
   * Function is used to reset the checker for next pull review.
   *
   * @return {undefined}
   */
  reset: function JavaCheckStyleReset() {
    this.checkedFiles = [];
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param {string} file   Relative path of file.
   * @returns {boolean}     If this checker validates given file.
   */
  doesValidate: function JavaCheckStyleDoesValidate( file ) {
    var validates = false;
    var included = ['.java'];
    
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
  processFile: function JavaCheckStyleProcessFile( path, source, callback ) {
    var me = this;
    var lineNumberPosition = 3;
    var messagePosition = 5;
    var rulePosition = 6;
    
    // Create a temporary file
    var tmp = require('tmp');
    var fs = require('fs');
    
    tmp.file({ postfix: '.java' }, function _tempFileCreated(err, tempPath, fd, cleanupCallback) {
      if (err) {
        logger.error(err);
      } else {
        
        // Write source to temporary file.
        fs.writeFile( tempPath, source, function _tempFileWritten(e) {
          var exec = require('child_process').exec;
          var cmd = 'java -jar libs/checkstyle-6.17-all.jar -c /google_checks.xml ' + tempPath;

          // Execute the command.
          exec(cmd, function recvData(err2, stdout, stderr) {
            var parseLine = /\[([A-Z]*)\] ([/a-zA-Z0-9~+._\-]*):([0-9]*):([0-9]*): ([a-zA-Z0-9 .+*/&|{}'";:_\-\[\]]*) \[([a-zA-Z]*)\]/g;
            
            // Process all errors
            var errors = [];
            
            if (err2) {
              logger.error( err2 );
            } else if (stderr) {
              logger.error( stderr );
            } else {
      
              // Get the output line by line.
              var index = stdout.indexOf( '\n' );
        
              // While we have more lines to read.
              while (index > -1) {
                var line = stdout.substring(0, index);
                stdout = stdout.substring(index + 1);
                index = stdout.indexOf('\n');
          
                // Parse the line using regular expressions.
                var result = parseLine.exec( line );
          
                if ( result ) {
                  var error = {
                    severity: result[1],
                    file: path,
                    line: parseInt(result[lineNumberPosition]),
                    message: result[messagePosition],
                    rule: result[rulePosition]
                  };
            
                  errors.push( error );
                }
              }
            }
            
            // Clean up the file as its no longer needed.
            cleanupCallback();
          
            // Let the caller know about the errors.
            callback( errors );
          });
        });
      }
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
  start: function JavaCheckStyleStart( from, baseSource, to, headSource, callback ) {
    var filesToCompare = 2;
    var me = this;
    var errors = {
      head: [],
      base: []
    };
    
    // Once everythins is done, finish off with this.
    var allDone = _.after( filesToCompare, function JavaCheckStyleFileDone() {
      // Remember this report.
      var report = {
        file: to,
        errors: errors
      };
      
      me.checkedFiles.push( report );
      callback();
    }); 
    
    // Review the base source code
    this.processFile( from, baseSource, function JavaCheckStyleBaseSourceErrors( errs ) {
      errors.base = errs;
      allDone();
    });
    
    // Review the head source code.
    this.processFile( to, headSource, function JavaCheckStyleHeadSourceErrors( errs ) {
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
  step: function JavaCheckStyleStep( change, path, position, callback ) {
    var comment = '';
    
    // On the line, only report on changes that were made.
    if ( change.add ) {
      for ( j = 0; j < this.checkedFiles.length; j++ ) {
        var f = this.checkedFiles[j]; 
        if ( f.file === path ) {
          for ( i = 0; i < f.errors.head.length; i++ ) {
            if ( f.errors.head[i] !== null && f.errors.head[i].line === change.ln ) {
              comment += f.errors.head[i].message + '\n```java\n' + change.content + '\n```\n';
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
  done: function JavaCheckStyleDone( callback ) {
    var comment = '';
    var maxErrorsPerFile = 5;
    
    // Look through all changed files and ensure that we 
    // have not added more errors in this pull.
    for ( i = 0; i < this.checkedFiles.length; i++ ) {
      f = this.checkedFiles[i];
      
      // We are only interested if the head branch still has
      // lint issues.
      if ( f.errors.head.length > 0 ) {
        baseIndex = 0;
        headIndex = 0;
        
        // We want to limit to no more than 5 comments per file
        errorsCount = 0;
      
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
              if ( !f.errors.head[headIndex].reported && f.errors.head[headIndex].severity >= this.SEVERITY_HIGH ) {
                comment += '\n**' + f.file + '(' + f.errors.head[ headIndex ].line + '):** *' + f.errors.head[ headIndex ].message + '*';
                errorsCount++;
              }
              
              headIndex++;
            }
          } else {
            // All these comments are not in the base branch, so they
            // are additional comments. Need to make sure we did not
            // report them in the line by line review.
            if ( !f.errors.head[headIndex].reported && f.errors.head[headIndex].severity >= this.SEVERITY_HIGH ) {
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