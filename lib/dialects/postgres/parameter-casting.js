// PostgreSQL Parameter Casting Solution for Issue #1001
// This module provides a simpler approach to preserve numeric types
// by adding PostgreSQL type casts directly in the SQL

// Override the parameter method to add casting for numbers
function parameterWithCasting(Client) {
  return function(value, builder, bindingsHolder) {
    // First, let the parent handle special cases (functions, raw queries)
    const baseResult = Client.prototype.parameter.call(
      this,
      value, 
      builder, 
      bindingsHolder
    );
    
    // If parent returned something other than '?', use it
    if (baseResult !== '?') {
      return baseResult;
    }
    
    // Check if we should add casting for this value
    if (shouldAddCasting(value, builder)) {
      const cast = getCastForValue(value);
      if (cast) {
        return `?::${cast}`;
      }
    }
    
    return '?';
  };
}

// Determine if we should add casting
function shouldAddCasting(value, builder) {
  // Only cast numbers
  if (typeof value !== 'number') {
    return false;
  }
  
  // Don't cast NaN or Infinity
  if (!isFinite(value)) {
    return false;
  }
  
  // Could add more logic here to check context
  // For example, we might not want to cast in certain situations
  return true;
}

// Get the appropriate PostgreSQL cast for a value
function getCastForValue(value) {
  if (typeof value === 'number' && isFinite(value)) {
    // Use integer cast for whole numbers
    if (Number.isInteger(value)) {
      // PostgreSQL integer types by range:
      // smallint: -32768 to 32767
      // integer: -2147483648 to 2147483647  
      // bigint: -9223372036854775808 to 9223372036854775807
      
      if (value >= -32768 && value <= 32767) {
        return 'smallint';
      } else if (value >= -2147483648 && value <= 2147483647) {
        return 'integer';
      } else {
        return 'bigint';
      }
    } else {
      // Use numeric for decimals (preserves precision)
      // Could use 'float8' for performance if precision isn't critical
      return 'numeric';
    }
  }
  
  return null;
}

// Alternative: Simpler version that just uses integer/numeric
function getCastForValueSimple(value) {
  if (typeof value === 'number' && isFinite(value)) {
    return Number.isInteger(value) ? 'integer' : 'numeric';
  }
  return null;
}

// For raw queries, we need a different approach
// This modifies the positionBindings to add casts
function positionBindingsWithCasting(sql, bindings) {
  let questionCount = 0;
  let bindingIndex = 0;
  
  return sql.replace(/(\\*)(\?)/g, function (match, escapes) {
    if (escapes.length % 2) {
      return '?';
    } else {
      questionCount++;
      const value = bindings && bindings[bindingIndex++];
      const cast = getCastForValueSimple(value);
      
      if (cast) {
        return `$${questionCount}::${cast}`;
      }
      return `$${questionCount}`;
    }
  });
}

module.exports = {
  parameterWithCasting,
  shouldAddCasting,
  getCastForValue,
  getCastForValueSimple,
  positionBindingsWithCasting
};