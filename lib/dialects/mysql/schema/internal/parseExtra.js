// Parses the Extra field from MySQL's SHOW FULL FIELDS output to extract
// column attributes that need to be preserved during column rename operations.
//
// The Extra field can contain multiple space-separated attributes such as:
//   - auto_increment
//   - on update CURRENT_TIMESTAMP
//   - on update CURRENT_TIMESTAMP(3)
//   - DEFAULT_GENERATED
//   - DEFAULT_GENERATED on update CURRENT_TIMESTAMP
//   - VIRTUAL GENERATED
//   - STORED GENERATED
//
// @param {string} extra - The Extra field value from SHOW FULL FIELDS
// @returns {object} Parsed attributes:
//   - isAutoIncrement {boolean}
//   - onUpdateValue {string|null} - The expression for ON UPDATE, if any
//   - isDefaultGenerated {boolean}

function parseExtra(extra) {
  const result = {
    isAutoIncrement: false,
    onUpdateValue: null,
    isDefaultGenerated: false,
  };

  if (!extra || typeof extra !== 'string') {
    return result;
  }

  const normalized = extra.trim();

  // Check for auto_increment
  if (/auto_increment/i.test(normalized)) {
    result.isAutoIncrement = true;
  }

  // Check for DEFAULT_GENERATED (MySQL 8.0.13+)
  if (/DEFAULT_GENERATED/i.test(normalized)) {
    result.isDefaultGenerated = true;
  }

  // Extract ON UPDATE clause
  // Matches: on update CURRENT_TIMESTAMP, on update CURRENT_TIMESTAMP(3), etc.
  const onUpdateMatch = normalized.match(
    /on\s+update\s+(CURRENT_TIMESTAMP(?:\(\d*\))?|NOW\(\d*\)|LOCALTIME(?:\(\d*\))?|LOCALTIMESTAMP(?:\(\d*\))?)/i
  );
  if (onUpdateMatch) {
    result.onUpdateValue = onUpdateMatch[1];
  }

  return result;
}

module.exports = parseExtra;
