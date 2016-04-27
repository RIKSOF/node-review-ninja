/**
 * Copyright RIKSOF (Private) Limited 2016.
 *
 * JS Style Checker.
 */

checker = function ESLintChecker() {
  
  /**
   * Array of file paths.
   */
  this.checkedFiles = [];
};

/**
 * Instance methods.
 */
checker.prototype = {
  
  SEVERITY_HIGH: 1,
  SEVERITY_MEDIUM: 2,
  SEVERITY_LOW: 3,
  
  /**
   * Function is used to reset the checker for next pull review.
   *
   * @return {undefined}
   */
  reset: function ESLintReset() {
    this.checkedFiles = [];
  },
  
  /**
   * Indicates to the caller if this checker is interested in given
   * file.
   *
   * @param {string} file   Relative path of file.
   * @returns {boolean}     If this checker validates given file.
   */
  doesValidate: function ESLintDoesValidate( file ) {
    var validates = false;
    var included = ['.js'];
    
    included.forEach( function eachInclude( e ) {
      if ( file.substr( -e.length) === e ) {
        validates = true;
      }
    });

    return validates;
  },
  
  /**
   * Process a new file both its current and proposed version.
   *
   * @param {string} from         Path of the base file.
   * @param {string} baseSource   Content of the base source file.
   * @param {string} to           Path of the head file.
   * @param {string} headSource   Content of the head source file.
   *
   * @return {undefined}
   */
  start: function ESLintStart( from, baseSource, to, headSource ) {
    var errors = {};

    var linter = require('eslint').linter;
    var rules = {
      'no-cond-assign': this.SEVERITY_HIGH,
      'no-console': this.SEVERITY_HIGH,
      'no-constant-condition': this.SEVERITY_HIGH,
      'no-dupe-args': this.SEVERITY_HIGH,
      'no-dupe-keys': this.SEVERITY_HIGH,
      'no-duplicate-case': this.SEVERITY_HIGH,
      'no-ex-assign': this.SEVERITY_HIGH,
      'no-extra-parens': this.SEVERITY_MEDIUM,
      'no-extra-semi': this.SEVERITY_MEDIUM,
      'no-func-assign': this.SEVERITY_HIGH,
      'no-irregular-whitespace': this.SEVERITY_HIGH,
      'no-sparse-arrays': this.SEVERITY_HIGH,
      'no-unexpected-multiline': this.SEVERITY_HIGH,
      'no-unreachable': this.SEVERITY_HIGH,
      'valid-jsdoc': this.SEVERITY_HIGH,
      'valid-typeof': this.SEVERITY_HIGH,
      'accessor-pairs': this.SEVERITY_HIGH,
      'array-callback-return': this.SEVERITY_HIGH,
      'block-scoped-var': this.SEVERITY_HIGH,
      'complexity': [this.SEVERITY_HIGH, { 'max': 4 }],
      'consistent-return': this.SEVERITY_HIGH,
      'curly': this.SEVERITY_HIGH,
      'dot-notation': this.SEVERITY_HIGH,
      'eqeqeq': this.SEVERITY_HIGH,
      'no-eval': this.SEVERITY_MEDIUM,
      'no-lone-blocks': this.SEVERITY_HIGH,
      'no-loop-func': this.SEVERITY_HIGH,
      'no-magic-numbers': this.SEVERITY_HIGH,
      'no-multi-spaces': this.SEVERITY_HIGH,
      'no-native-reassign': this.SEVERITY_HIGH,
      'no-new': this.SEVERITY_HIGH,
      'no-new-func': this.SEVERITY_HIGH,
      'no-proto': this.SEVERITY_HIGH,
      'no-redeclare': this.SEVERITY_HIGH,
      'no-return-assign': this.SEVERITY_HIGH,
      'no-self-assign': this.SEVERITY_HIGH,
      'no-self-compare': this.SEVERITY_HIGH,
      'no-unmodified-loop-condition': this.SEVERITY_HIGH,
      'no-unused-expressions': this.SEVERITY_HIGH,
      'no-useless-call': this.SEVERITY_HIGH,
      'no-useless-concat': this.SEVERITY_HIGH,
      'no-useless-escape': this.SEVERITY_HIGH,
      'no-shadow': this.SEVERITY_LOW,
      'no-shadow-restricted-names': this.SEVERITY_LOW,
      'array-bracket-spacing': [this.SEVERITY_LOW, 'never'],
      'block-spacing': this.SEVERITY_LOW,
      'brace-style': this.SEVERITY_LOW,
      'camelcase': this.SEVERITY_LOW,
      'comma-spacing': this.SEVERITY_LOW,
      'consistent-this': [ this.SEVERITY_LOW, 'me'],
      'func-names': this.SEVERITY_LOW,
      'indent': [this.SEVERITY_LOW, 2],
      'key-spacing': this.SEVERITY_LOW,
      'keyword-spacing': this.SEVERITY_LOW,
      'quotes': [this.SEVERITY_LOW, 'single'],
      'semi': this.SEVERITY_LOW,
      'semi-spacing': this.SEVERITY_LOW
    }

    // Lint the base source.
    errors.base = linter.verify( baseSource, {
      rules: rules 
    });
    
    // Lint the head source.
    errors.head = linter.verify( headSource, {
      rules: rules 
    });
    
    // Remember this report.
    var report = {
      file: to,
      errors: errors
    };
    
    this.checkedFiles.push( report );
  },
  
  /**
   * Processes a step in the diff file.
   * 
   * @param {Object} change       Line being read
   * @param {string} path         File path
   * @param {number} position     Position in file
   * @callback callback           Once processing is done.
   *
   * @return {undefined}
   */
  step: function ESLintStep( change, path, position, callback ) {
    var comment = '';
    
    // On the line, only report on changes that were made.
    if ( change.add ) {
      for ( j = 0; j < this.checkedFiles.length; j++ ) {
        var f = this.checkedFiles[j]; 
        if ( f.file === path ) {
          for ( i = 0; i < f.errors.head.length; i++ ) {
            if ( f.errors.head[i] !== null && f.errors.head[i].line === change.ln ) {
              comment += f.errors.head[i].message + '\n```javascript\n' + f.errors.head[i].source + '\n```\n';
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
   * @callback callback    Once processing is done.
   *
   * @return {undefined}
   */
  done: function ESLintDone( callback ) {
    var comment = '';
    
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
        while ( f.errors.head !== null && headIndex < f.errors.head.length && errorsCount < 5 ) {
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
              if ( !f.errors.head[headIndex].reported && f.errors.head[headIndex].severity >= this.SEVERITY_HIGH ) {
                comment += '\n**' + f.file + '(' + f.errors.head[ headIndex ].line + '):** *' + f.errors.head[ headIndex ].message + '*';
                comment += '\n```javascript\n' + f.errors.head[headIndex].source + '\n```\n';
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
              comment += '\n```javascript\n' + f.errors.head[headIndex].source + '\n```\n';
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