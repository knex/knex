const { times, findIndex, isEmpty, compact, isNil, isFunction, isString, cloneDeep, castArray } = require("lodash");
const Tokenizer = require("tokenize-this");
const { operators } = require("../operators");

/**
 * Provides a fluent API to statefully traverse a token list, and perform token-level and
 * range-level manipulations.
 */
class SQLTokenListVisitor {
    /**
     * @param {string[]} tokens List of tokens extracted from raw SQL
     */
    constructor(tokens) {
        if (isString(tokens)) tokens = this.tokenize(tokens);
        this.tokens = tokens;
    }

    /**
     * Splits the SQL string into list of tokens.
     * 
     * @param {string} rawStr 
     */
    tokenize(rawStr) {
        const tokens = [];
        const tokenizer = new Tokenizer();
        tokenizer.tokenize(rawStr, (_token, surroundedBy) => {
            const token = `${surroundedBy || ''}${_token}${surroundedBy || ''}`;

            // Tokenizer is not SQL aware.
            //
            // We need to look back and check if combining this token with the
            // last one gives us a valid SQL operator, in which case we will need
            // to put them in the same token.
            //
            // This ensures that when joining them back we don't end up with invalid
            // SQL (eg. && -> & &).
            if (!surroundedBy) {
                const operatorCandidates = [];
                if (tokens.length > 0) {
                    operatorCandidates.push(tokens[tokens.length - 1] + token);
                }
                if (tokens.length > 1) {
                    operatorCandidates.push(
                        tokens[tokens.length - 2] + 
                        tokens[tokens.length - 1] +
                        token
                    );
                }
                for (const candidate of operatorCandidates) {
                    const isKnownOperator = !!operators[operatorCandidates];
                    if (isKnownOperator) {
                        times(candidate.length-1, () => tokens.pop());
                        tokens.push(candidate);
                        return;
                    }
                }
            }
            tokens.push(token);
        });
        return tokens;
    }

    /**
     * Combine tokens to SQL string
     */
    toString() {
        return compact(this.tokens).join(' ');
    }

    /**
     * Return TokenItemVisitor for specified token
     * 
     * @param {string} token token to seek
     * @param {boolean} isCaseSensitive if match should be case sensitive
     * @param {number} startIdx position from where we should start looking (towards right)
     */
    findToken(token, isCaseSensitive = false, startIdx = 0) {
        if (!isString(token)) {
            throw new TypeError(`Expected token to be a string but found: ${token} (type: ${typeof token}) instead`)
        }
        const lowerValue = token.toLowerCase();
        for (let i = startIdx; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            const didMatch = isCaseSensitive
                ? token === token
                : token.toLowerCase() === lowerValue;
            if (didMatch) return new TokenItemVisitor(i, this);
        }
        return null;
    }

    /**
     * @return TokenItemVisitor for first token in the list
     */
    first() {
        return new TokenItemVisitor(0, this);
    }

    /**
     * @return TokenItemVisitor for last token in the list
     */
    last() {
        return new TokenItemVisitor(this.tokens.length - 1, this);
    }

    /**
     * Replace range of tokens
     * 
     * @param {number} startIdx 
     * @param {number} endIdx 
     * @param {string | string[]} tokenList 
     */
    _replaceRange(startIdx, endIdx, tokenList) {
        const normalized = this._normalizeTokenList(tokenList);
        this.tokens.splice(startIdx, endIdx - startIdx, ...normalized);
        return new TokenRangeVisitor(startIdx, normalized.length, this);
    }

    /**
     * Replace token at specified index
     * 
     * @param {number} index 
     * @param {string | string[]} tokenList token(s) to be inserted
     */
    _replaceAtIndex(index, tokenList) {
        const normalized = this._normalizeTokenList(tokenList);
        this.tokens.splice(index, 1, ...normalized);
        return new TokenRangeVisitor(index, normalized.length, this);
    }

    /**
     * Insert new token(s) at specified index
     * 
     * @param {number} index
     * @param {string | string[]} tokenList token(s) to be inserted
     */
    _insertAtIndex(index, tokenList) {
        const normalized = this._normalizeTokenList(tokenList);
        if (normalized.length === 0) return null;
        this.tokens.splice(index, 0, ...normalized);
        return new TokenRangeVisitor(index, normalized.length, this);
    }

    /**
     * Ensure array and remove empty tokens
     * 
     * @param {string[] | string} tokenList 
     */
    _normalizeTokenList(tokenList) {
        return compact(castArray(tokenList));
    }

    /**
     * Select a range of tokens 
     * 
     * @param {number} start the index where to begin (inclusive)
     * @param {number} step +1 if we are going forward, -1 if we are going back
     * @param {(token: string, index: number) => boolean} predicate Condition evaluated for each token to determine if we should proceed.
     * @return TokenRangeVisitor
     */
    _selectRange(start, step, predicate) {
        const range = { start: null, end: null };
        for (let i = start; i < this.tokens.length && i >= 0; i += step) {
            const token = this.tokens[i];
            const shouldSelect = predicate(token, i);
            if (shouldSelect) {
                if (i <= start) {
                    // Going backward: Update the start
                    range.start = i;
                }
                if (i >= start) {
                    // Going forward: Update the end
                    range.end = i + 1;
                }
            } else break;
        }
        if (isNil(range.start) || isNil(range.end)) {
            return null;
        }
        return new TokenRangeVisitor(range.start, range.end, this);
    }
}

/**
 * Visitor that tracks a position (index) in a token list
 */
class TokenItemVisitor {
    /**
     * @param {number} index 
     * @param {string[]} tokenListVisitor 
     */
    constructor(index, tokenListVisitor) {
        this.index = index;
        this.tokenListVisitor = tokenListVisitor;
    }

    /**
     * Get token at current index
     */
    token() {
        return this.tokenListVisitor.tokens[this.index];
    }

    /**
     * Peek next token in list without actually changing visitor state. 
     * 
     * Useful for finite lookahead.
     * 
     * @param {number} count Number of steps to look ahead. Use negative number to look behind.
     */
    peek(count = 1) {
        return this.tokenListVisitor.tokens.slice(this.index, this.index + count).join(' ');
    }

    /**
     * Visit next occurance of specified token towards the right from current position.
     * 
     * @param {string} token 
     * @param {boolean} isCaseSensitive 
     */
    next(token, isCaseSensitive = false) {
        if (!isNil(token)) {
            return this.tokenListVisitor.findToken(token, isCaseSensitive, this.index + 1);
        }
        this.index += 1;
        return this;
    }

    /**
     * Replace the currently visited token.
     * 
     * @param {string | string[] | (token: string) => string | string[]} 
     *     If a single string is passed it will be tokenized
     *     If an array of strings is passed, they will be considered to be already tokenized
     *     If function is passed, it will be invoked with previous token and its returned value 
     *         will be treated as above
     */
    replace(replacement) {
        if (isFunction(replacement)) {
            const token = cloneDeep(this.tokenListVisitor.tokens[this.index])
            replacement = replacement(token)
        }
        if (isString(replacement)) replacement = this.tokenListVisitor.tokenize(replacement);
        return this.tokenListVisitor._replaceAtIndex(this.index, replacement)
    }

    /**
     * Insert one of more tokens before current token.
     * 
     * @param {string | string[]} tokens tokenized only if a single string is passed
     */
    insertBefore(tokens) {
        if (isString(tokens)) tokens = this.tokenListVisitor.tokenize(tokens);
        if (isEmpty(tokens)) throw new Error("Expected to find atleast one token");
        return this.tokenListVisitor._insertAtIndex(this.index, tokens);
    }

    /**
     * Insert one or more tokens after current token.
     * 
     * @param {string | string[]} tokens tokenized only if a single string is passed
     */
    insertAfter(tokens) {
        if (isString(tokens)) tokens = this.tokenListVisitor.tokenize(tokens);
        if (isEmpty(tokens)) throw new Error("Expected to find atleast one token");
        return this.tokenListVisitor._insertAtIndex(this.index + 1, tokens);
    }

    _normalizeSelectionPredicate(predicate, targetIndex) {
        if (isNil(predicate)) return takeOneAt(targetIndex);
        if (isFunction(predicate)) return predicate;
        throw new Error(`Invalid predicate supplied: ${predicate}. Expected function or token`);
    }

    /**
     * Select some tokens starting from current position (Current token is included)
     * 
     * @param {undefined | ((token: string) => boolean)} until
     *     If undefined, next token will be selected.
     *     If function, every token in sequence will be called with that predicate and will
     *         be selected until the predicate returns false, at which point range will end.
     */
    select(until) {
        const predicate = this._normalizeSelectionPredicate(until, this.index);
        return this.tokenListVisitor._selectRange(this.index, 1, predicate);
    }

    /**
     * Select some tokens going back from current position (current token is not included)
     * 
     * @param {undefined | ((token: string) => boolean)} until 
     *     Refer select docs for this param
     */
    selectPrev(until) {
        const start = this.index - 1;
        const predicate = this._normalizeSelectionPredicate(until, start)
        return this.tokenListVisitor._selectRange(start, -1, predicate);
    }

    /**
     * Select some tokens going forward from current position (current token is not included)
     * 
     * @param {undefined | ((token: string) => boolean)} until 
     *     Refer select docs for this param
     */
    selectNext(until) {
        const start = this.index + 1;
        const predicate = this._normalizeSelectionPredicate(until, start)
        return this.tokenListVisitor._selectRange(start, 1, predicate);
    }
}

/**
 * Visitor that tracks a range (start index to end index) in a token list
 */
class TokenRangeVisitor {
    /**
     * @param {number} startIndex 
     * @param {number} endIndex 
     * @param {string[]} tokenListVisitor 
     */
    constructor(startIndex, endIndex, tokenListVisitor) {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.tokenListVisitor = tokenListVisitor;
    }

    /**
     * Get TokenItemVisitor for first token in the selected range
     */
    first() {
        return new TokenItemVisitor(this.startIndex, this.tokenListVisitor);
    }

    /**
     * Get TokenItemVisitor for last token in the selected range
     */
    last() {
        return new TokenItemVisitor(this.endIndex, this.tokenListVisitor);
    }

    /**
     * Extend selection to left until the predicate returns false.
     * 
     * If predicate is not provided then one token to left is added to selection.
     * 
     * @param {(token: string) => booleab} [until] predicate used to determine when to stop
     */
    extendLeft(until) {
        const rangeVisitor = this.tokenListVisitor._selectRange(this.startIndex, -1, until);
        if (!isNil(rangeVisitor)) {
            rangeVisitor.endIndex = this.endIndex;
        }
        return rangeVisitor;
    }

    /**
     * Extend selection to right until the predicate returns false.
     * 
     * If predicate is not provided then one token to right is added to selection.
     * 
     * @param {(token: string) => booleab} [until] predicate used to determine when to stop
     */
    extendRight(until) {
        const rangeVisitor = this.tokenListVisitor._selectRange(this.endIndex, 1, until);
        if (!isNil(rangeVisitor)) {
            rangeVisitor.startIndex = this.startIndex;
        }
        return rangeVisitor
    }

    /**
     * Replace selection with specified token(s)
     * 
     * @param {string | string[]} replacement tokenized only if a single string is passed.
     */
    replace(replacement) {
        if (isFunction(replacement)) {
            const tokens = cloneDeep(this.tokenListVisitor.tokens.slice(this.startIndex, this.endIndex))
            replacement = replacement(tokens)
        }
        if (isString(replacement)) replacement = this.tokenListVisitor.tokenize(replacement);
        return this.tokenListVisitor._replaceRange(
            this.startIndex,
            this.endIndex,
            replacement
        );
    }
}

const takeOneAt = (index) => (_token, i) => i === index;

module.exports = { SQLTokenListVisitor };