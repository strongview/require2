var vm = require('vm');
var fs = require('fs');
var path = require('path');
var assert = require('assert');

var js = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');

describe('require', function() {
  it('should contain component\'s require', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    var componentRequire = vm.runInContext('require', ctx);
    assert.equal(componentRequire.loader, 'component');
    componentRequire.modules['component~dom@1.0.0'] = {exports: '1.0.0'};
    var resolved = componentRequire('component~dom@1.0.0');
    assert.equal(resolved, '1.0.0');
  })

  it('should have a sorting helper for semantic versioning', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    var sortingFn = vm.runInContext('require.helper.semVerSort', ctx);
    var test = [
      {name: 1, version: '2.0.0'},
      {name: 2, version: '0.0.0'},
      {name: 3, version: '1.0.11'},
      {name: 4, version: '1.1.0'},
      {name: 5, version: '1.0.0-beta'},
      {name: 6, version: '1.0.2'},
      {name: 7, version: '1.0.0'},
      {name: 8, version: '1.2.1'},
      {name: 9, version: '1.0.0-rc1'},
    ];
    var expected = [
      {name: 2, version: '0.0.0'},
      {name: 5, version: '1.0.0-beta'},
      {name: 9, version: '1.0.0-rc1'},
      {name: 7, version: '1.0.0'},
      {name: 6, version: '1.0.2'},
      {name: 3, version: '1.0.11'},
      {name: 4, version: '1.1.0'},
      {name: 8, version: '1.2.1'},
      {name: 1, version: '2.0.0'}
    ];
  
    var result = test.sort(sortingFn);
    assert.deepEqual(result, expected);
  })

  it('should not sort same versions', function() {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    var sortingFn = vm.runInContext('require.helper.semVerSort', ctx);

    var test = [
      {name: 11, version: '1.0.0-rc1'},
      {name: 10, version: '1.0.0-rc1'},
      {name: 9, version: '1.0.0-rc1'},
      {name: 5, version: '1.0.0-beta'},
      {name: 12, version: '1.0.0-rc1'},
      {name: 13, version: '1.0.0-rc1'}
    ];
    var expected = [
      {name: 5, version: '1.0.0-beta'},
      {name: 11, version: '1.0.0-rc1'},
      {name: 10, version: '1.0.0-rc1'},
      {name: 9, version: '1.0.0-rc1'},
      {name: 12, version: '1.0.0-rc1'},
      {name: 13, version: '1.0.0-rc1'}
    ];

    var result = test.sort(sortingFn);
    assert.deepEqual(result, expected);
  
  });

  it('should return latest semantic version of a module', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    var componentRequire = vm.runInContext('require', ctx);
    componentRequire.modules['component~dom@1.0.2'] = {exports: '1.0.2'};
    componentRequire.modules['component~dom@1.0.11'] = {exports: '1.0.11'};
    componentRequire.modules['component~dom@1.0.0'] = {exports: '1.0.0'};
    componentRequire.modules['component~dom@master'] = {exports: 'master'};
    componentRequire.modules['component'] = {exports: 'a local component'};
    componentRequire.modules['dom'] = {exports: 'another local'};
    assert.throws(function() {componentRequire.latest('component')});
    assert.throws(function() {componentRequire.latest('dom')});
    var resolved = componentRequire.latest('component~dom');
    assert.equal(resolved, '1.0.11');
    })

  it('should return a branch version of a module if no semvers were found', function () {
    var ctx = vm.createContext();
    vm.runInContext(js, ctx);
    var componentRequire = vm.runInContext('require', ctx);
    componentRequire.modules['component~dom@master'] = {exports: 'master'};
    var resolved = componentRequire.latest('component~dom');
    assert.equal(resolved, 'master');
  })
})