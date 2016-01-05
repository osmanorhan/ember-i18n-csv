var fs = require('fs');
var path = require('path');
var stringify = require('csv-stringify');
var eol = require('eol');
require('6to5/register');

module.exports = function(localesPath, csvPath) {
  var locales = fs.readdirSync(localesPath);

  var keys = [];
  var rows = [];

  function recurse(json, columnIndex, rowIndex, currentKey) {
    for (var key in json) {
      var value = json[key];
      var newKey = currentKey;
      if (newKey) {
        newKey += '.';
      }
      newKey += key;
      if (typeof value === 'object') {
        rowIndex = recurse(value, columnIndex, rowIndex, newKey);
      } else {
        var row;
        var index = keys.indexOf(newKey);
        if (index !== -1) {
          row = rows[index];
        } else {
          row = [];
          rows.splice(rowIndex, 0, row);
          keys.splice(rowIndex, 0, newKey);
        }
        for (var i in locales) {
          if (i == columnIndex) {
            row[i] = value;
          } else if (!row[i]) {
            row[i] = '';
          }
        }
        rowIndex++;
      }
    }
    return rowIndex;
  }

  for (var columnIndex in locales) {
    var locale = locales[columnIndex];
    var filePath = path.resolve(localesPath, locale, 'translations.js');
    var json = require(filePath);
    recurse(json, columnIndex, 0, '');
  }

  var lines = [];
  lines.push(['key'].concat(locales.map(function(locale) { return locale.replace('.js', ''); })));
  for (var i in keys) {
    lines.push([keys[i]].concat(rows[i]));
  }

  stringify(lines, function(err, csv) {
    var normalized = eol.auto(csv);
    fs.writeFileSync(csvPath, normalized);
  });
};