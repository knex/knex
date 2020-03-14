if (typeof BigInt !== 'undefined') {
  exports.lowerInt64 = -(BigInt(2) ** BigInt(63));
  exports.upperInt64 = BigInt(2) ** BigInt(63) - BigInt(1);

  exports.differentBigInts = [
    -(BigInt(2) ** BigInt(128)),
    exports.lowerInt64,
    -(BigInt(2) ** BigInt(64)),
    -BigInt(Number.MAX_VALUE) * BigInt(2),
    -BigInt(Number.MAX_VALUE),
    BigInt(Number.MIN_SAFE_INTEGER) - BigInt(2),
    BigInt(Number.MIN_SAFE_INTEGER),
    BigInt(-(2 ** 40)),
    BigInt(-(2 ** 32)),
    BigInt(-(2 ** 15)),
    BigInt(-1),
    BigInt(0),
    BigInt(2 ** 15),
    BigInt(2 ** 32),
    BigInt(2 ** 40),
    BigInt(Number.MAX_SAFE_INTEGER),
    BigInt(Number.MAX_SAFE_INTEGER) + BigInt(2),
    BigInt(Number.MAX_VALUE),
    BigInt(Number.MAX_VALUE) * BigInt(2),
    exports.upperInt64,
    BigInt(2) ** BigInt(64),
    BigInt(2) ** BigInt(128),
  ];
} else {
  exports.differentBigInts = [];
}
