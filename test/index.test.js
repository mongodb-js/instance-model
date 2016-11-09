const assert = require('assert');
const Instance = require('../');
const hostname = require('os').hostname();

describe('mongodb-instance-model', () => {
  it('should have a derived hostname property', () => {
    assert.equal(new Instance({
      _id: 'localhost:27017'
    }).hostname, 'localhost');
  });
  it('should have a derived port property', () => {
    assert.equal(new Instance({
      _id: 'localhost:27017'
    }).port, 27017);
  });
  describe('getId()', () => {
    it('should substitute localhost as the canonical hostname', () => {
      assert.equal(Instance.getId(hostname), 'localhost');
    });
    it('should treat a number param as the port', () => {
      assert.equal(Instance.getId(27017), 'localhost:27017');
    });
    it('should remove mongodb://', () => {
      assert.equal(Instance.getId('mongodb://localhost:27017'), 'localhost:27017');
    });
    it('should remove mongodb://user:pass@', () => {
      assert.equal(Instance.getId('mongodb://matt:123@localhost:27017'), 'localhost:27017');
    });
    it('should remove user:pass@', () => {
      assert.equal(Instance.getId('matt:123@localhost:27017'), 'localhost:27017');
    });
    it('should remove a trailing option', () => {
      assert.equal(Instance.getId('localhost:27017/?option=thing'), 'localhost:27017');
    });
    it('should remove many trailing options', () => {
      assert.equal(Instance.getId('localhost:27017/?option=thing&otherThing=coolStuff&zombies=true'), 'localhost:27017');
    });
    it('should substitute localhost for 127.0.0.1', () => {
      assert.equal(Instance.getId('127.0.0.1:27017'), 'localhost:27017');
    });
  });
});
