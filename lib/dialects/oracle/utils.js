'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

function generateCombinedName(postfix, name, subNames) {
  var crypto = require('crypto');
  var limit = 30;
  if (!Array.isArray(subNames)) subNames = subNames ? [subNames] : [];
  var table = name.replace(/\.|-/g, '_');
  var subNamesPart = subNames.join('_');
  var result = (table + '_' + (subNamesPart.length ? subNamesPart + '_' : '') + postfix).toLowerCase();
  if (result.length > limit) {
    helpers.warn('Automatically generated name "' + result + '" exceeds ' + limit + ' character ' + 'limit for Oracle. Using base64 encoded sha1 of that name instead.');
    // generates the sha1 of the name and encode it with base64
    result = crypto.createHash('sha1').update(result).digest('base64').replace('=', '');
  }
  return result;
}

function wrapSqlWithCatch(sql, errorNumberToCatch) {
  return 'begin execute immediate \'' + sql.replace(/'/g, "''") + '\'; ' + ('exception when others then if sqlcode != ' + errorNumberToCatch + ' then raise; ') + 'end if; ' + 'end;';
}

function ReturningHelper(columnName) {
  this.columnName = columnName;
}

ReturningHelper.prototype.toString = function () {
  return '[object ReturningHelper:' + this.columnName + ']';
};

exports.generateCombinedName = generateCombinedName;
exports.wrapSqlWithCatch = wrapSqlWithCatch;
exports.ReturningHelper = ReturningHelper;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9vcmFjbGUvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O3VCQUN5QixlQUFlOztJQUE1QixPQUFPOztBQUVuQixTQUFTLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0FBQ3JELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDakIsTUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxHQUFHLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNwRSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztBQUN6QyxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hDLE1BQUksTUFBTSxHQUFHLENBQUcsS0FBSyxVQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsWUFBWSxHQUFHLEdBQUcsR0FBRSxFQUFFLENBQUEsR0FBRyxPQUFPLEVBQUcsV0FBVyxFQUFFLENBQUM7QUFDaEcsTUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssRUFBRTtBQUN6QixXQUFPLENBQUMsSUFBSSxDQUNWLG1DQUFpQyxNQUFNLGtCQUFhLEtBQUssc0ZBQ1UsQ0FDcEUsQ0FBQzs7QUFFRixVQUFNLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FDL0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUNkLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FDaEIsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztHQUNyQjtBQUNELFNBQU8sTUFBTSxDQUFDO0NBQ2Y7O0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLEVBQUU7QUFDakQsU0FDRSwrQkFBNEIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLDJEQUNQLGtCQUFrQixtQkFBZSxhQUNuRSxTQUNKLENBQ047Q0FDSDs7QUFFRCxTQUFTLGVBQWUsQ0FBQyxVQUFVLEVBQUU7QUFDbkMsTUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7Q0FDOUI7O0FBRUQsZUFBZSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsWUFBWTtBQUMvQyxzQ0FBa0MsSUFBSSxDQUFDLFVBQVUsT0FBSTtDQUN0RCxDQUFBOztRQUVRLG9CQUFvQixHQUFwQixvQkFBb0I7UUFBRSxnQkFBZ0IsR0FBaEIsZ0JBQWdCO1FBQUUsZUFBZSxHQUFmLGVBQWUiLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi4vLi4vaGVscGVycyc7XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQ29tYmluZWROYW1lKHBvc3RmaXgsIG5hbWUsIHN1Yk5hbWVzKSB7XG4gIGNvbnN0IGNyeXB0byA9IHJlcXVpcmUoJ2NyeXB0bycpO1xuICBjb25zdCBsaW1pdCA9IDMwO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoc3ViTmFtZXMpKSBzdWJOYW1lcyA9IHN1Yk5hbWVzID8gW3N1Yk5hbWVzXSA6IFtdO1xuICBjb25zdCB0YWJsZSA9IG5hbWUucmVwbGFjZSgvXFwufC0vZywgJ18nKTtcbiAgY29uc3Qgc3ViTmFtZXNQYXJ0ID0gc3ViTmFtZXMuam9pbignXycpO1xuICBsZXQgcmVzdWx0ID0gYCR7dGFibGV9XyR7c3ViTmFtZXNQYXJ0Lmxlbmd0aCA/IHN1Yk5hbWVzUGFydCArICdfJzogJyd9JHtwb3N0Zml4fWAudG9Mb3dlckNhc2UoKTtcbiAgaWYgKHJlc3VsdC5sZW5ndGggPiBsaW1pdCkge1xuICAgIGhlbHBlcnMud2FybihcbiAgICAgIGBBdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBuYW1lIFwiJHtyZXN1bHR9XCIgZXhjZWVkcyAke2xpbWl0fSBjaGFyYWN0ZXIgYCArXG4gICAgICBgbGltaXQgZm9yIE9yYWNsZS4gVXNpbmcgYmFzZTY0IGVuY29kZWQgc2hhMSBvZiB0aGF0IG5hbWUgaW5zdGVhZC5gXG4gICAgKTtcbiAgICAvLyBnZW5lcmF0ZXMgdGhlIHNoYTEgb2YgdGhlIG5hbWUgYW5kIGVuY29kZSBpdCB3aXRoIGJhc2U2NFxuICAgIHJlc3VsdCA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGExJylcbiAgICAgIC51cGRhdGUocmVzdWx0KVxuICAgICAgLmRpZ2VzdCgnYmFzZTY0JylcbiAgICAgIC5yZXBsYWNlKCc9JywgJycpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHdyYXBTcWxXaXRoQ2F0Y2goc3FsLCBlcnJvck51bWJlclRvQ2F0Y2gpIHtcbiAgcmV0dXJuIChcbiAgICBgYmVnaW4gZXhlY3V0ZSBpbW1lZGlhdGUgJyR7c3FsLnJlcGxhY2UoLycvZywgXCInJ1wiKX0nOyBgICtcbiAgICBgZXhjZXB0aW9uIHdoZW4gb3RoZXJzIHRoZW4gaWYgc3FsY29kZSAhPSAke2Vycm9yTnVtYmVyVG9DYXRjaH0gdGhlbiByYWlzZTsgYCArXG4gICAgYGVuZCBpZjsgYCArXG4gICAgYGVuZDtgXG4gICk7XG59XG5cbmZ1bmN0aW9uIFJldHVybmluZ0hlbHBlcihjb2x1bW5OYW1lKSB7XG4gIHRoaXMuY29sdW1uTmFtZSA9IGNvbHVtbk5hbWU7XG59XG5cblJldHVybmluZ0hlbHBlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgW29iamVjdCBSZXR1cm5pbmdIZWxwZXI6JHt0aGlzLmNvbHVtbk5hbWV9XWA7XG59XG5cbmV4cG9ydCB7IGdlbmVyYXRlQ29tYmluZWROYW1lLCB3cmFwU3FsV2l0aENhdGNoLCBSZXR1cm5pbmdIZWxwZXIgfTtcbiJdfQ==