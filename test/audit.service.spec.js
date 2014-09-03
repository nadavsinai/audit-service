'use strict';

describe('Audit Service Unit-Test', function(){
    var audit,
        schema,
        Audit,
        sinon = require('sinon'),
        rewire = require('rewire'),
        String = require('../lib/data/string.data');

    require('../lib/index');

    beforeEach(function(){
        audit = rewire('../lib/service/audit.service');

        // Mock the Schema
        schema = {
            paths : {
                field1 : {
                    options : {
                        audit : {
                            compare : false
                        }
                    }
                },
                field2 : {
                    options : {

                    }
                },
                field3 : {

                }
            },
            _event : {},
            post : function(string, callback){
                schema._event[string] = callback;
            }
        };
    });

    it ('should test all events registration', function(){
        audit.registerAudit(schema);

        expect(typeof schema._event.init).toEqual('function');
        expect(typeof schema._event.remove).toEqual('function');
        expect(typeof schema._event.save).toEqual('function');
    });

    describe('Audit process Testing with default comparator', function(){
        beforeEach(function(){
            audit.registerAudit(schema);

            Audit = function(){
                this.oldObject;
                this.newObject;
                this.operation;
                this.updateBy;
            };

            audit.__set__('Audit', Audit);
        });

        it ('should test load operation', function(){
            var memoryMock = sinon.stub({
                set : function(){}
            });
            audit.__set__('memory', memoryMock);
            var obj = {
                id : 1234,
                NEW_OBJECT : 'NEW_OBJECT',
                toObject : function(){
                    return this;
                }
            };

            schema._event.init(obj);

            expect(memoryMock.set.calledWith(1234, obj)).toBeTruthy();
        });

        it ('should test insert operation', function(done){
            Audit.prototype.save = function(callback){
                expect(typeof this.oldObject).toEqual('undefined');
                expect(this.newObject.id).toEqual(1234);
                expect(this.newObject.NEW_OBJECT).toEqual('NEW_OBJECT');
                expect(this.operation).toEqual(String.OPERATION_INSERT);

                callback(null);
                done();
            };

            var obj = {
                id : 1234,
                NEW_OBJECT : 'NEW_OBJECT',
                toObject : function(){
                    return this;
                }
            };

            schema._event.save(obj);
        });

        it ('should test remove operation', function(done){
            Audit.prototype.save = function(callback){
                expect(this.oldObject.id).toEqual(1234);
                expect(this.oldObject.NEW_OBJECT).toEqual('NEW_OBJECT');
                expect(typeof this.newObject).toEqual('undefined');
                expect(this.operation).toEqual(String.OPERATION_REMOVE);

                callback(null);
                done();
            };

            var obj = {
                id : 1234,
                NEW_OBJECT : 'NEW_OBJECT',
                toObject : function(){
                    return this;
                }
            };

            schema._event.init(obj);

            schema._event.remove(obj);
        });

        it ('should test update operation', function(done){
            Audit.prototype.save = function(callback){
                console.log(this);
                expect(this.oldObject.id).toEqual(1234);
                expect(this.oldObject.NEW_OBJECT).toEqual('OLD_OBJECT');
                expect(this.newObject.id).toEqual(1234);
                expect(this.newObject.NEW_OBJECT).toEqual('NEW_OBJECT');
                expect(this.operation).toEqual(String.OPERATION_UPDATE);

                callback(null);
                done();
            };

            var obj = {
                id : 1234,
                NEW_OBJECT : 'OLD_OBJECT',
                toObject : function(){
                    return this;
                }
            };

            schema._event.init(obj);

            obj.NEW_OBJECT = 'NEW_OBJECT';

            schema._event.save(obj);
        });
    });
});