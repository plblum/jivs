/*
 * CapturingLogger is part of the testing side of the JIVS engine. 
 * It still needs its own unit tests, implemented here.
*/

import { LoggingCategory, LoggingLevel } from "../../src/Interfaces/LoggerService";
import { CapturedLogDetails, CapturingLogger } from "../TestSupport/CapturingLogger";

class TestCapturingLogger extends CapturingLogger {
    public getCapturedLogs(): Array<any> {
        return this.captured;
    }
    public manualAdd(details: Partial<CapturedLogDetails>): void {
        this.addCaptured(details as CapturedLogDetails);
    }
}

describe('CapturingLogger', () => {
    let logger: TestCapturingLogger;

    beforeEach(() => {
        logger = new TestCapturingLogger();
    });

    describe('findMessage', () => {
        it('should return null when no messages are captured', () => {
            const result = logger.findMessage('test');
            expect(result).toBeNull();
        });

        describe('message parameter', () => {
            it('should find a message by partial string match', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'This is a test message' });
                const result = logger.findMessage('test message');
                expect(result).not.toBeNull();
                expect(result!.message).toContain('test message');
            });
            // case insensitive string match
            it('should find a message by partial string match, case insensitive', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'This is a test message' });
                const result = logger.findMessage('TEST MESSAGE');
                expect(result).not.toBeNull();
                expect(result!.message).toContain('test message');
            });
            it('should find a message by RegExp', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'RegExp match test', category: LoggingCategory.Configuration });
                const result = logger.findMessage(/RegExp match/);
                expect(result).not.toBeNull();
                expect(result!.message).toMatch(/RegExp match/);
            });            
            // case insensitive regexp match
            it('should find a message by RegExp, case insensitive', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'RegExp match test', category: LoggingCategory.Configuration });
                const result = logger.findMessage(/regexp match/i);
                expect(result).not.toBeNull();
                expect(result!.message).toMatch(/RegExp match/);
            });

            // case sensitive exact match regexp
            it('should find a message by RegExp, case sensitive', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'RegExp match test', category: LoggingCategory.Configuration });
                const result = logger.findMessage(/RegExp match/i);
                expect(result).not.toBeNull();
                expect(result!.message).toMatch(/RegExp match/);
            });

            it('should return null if no message matches the criteria', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'This will not match', category: LoggingCategory.Configuration });
                const result = logger.findMessage('nonexistent message');
                expect(result).toBeNull();
            });
    
            it('should handle complex RegExp searches', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Complex RegExp search 123', category: LoggingCategory.Configuration });
                const result = logger.findMessage(/Complex RegExp search \d+/);
                expect(result).not.toBeNull();
                expect(result!.message).toMatch(/Complex RegExp search \d+/);
            });
    
            it('should return null when searching with a RegExp that does not match', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'No match for this RegExp', category: LoggingCategory.Configuration });
                const result = logger.findMessage(/RegExp that does not match/);
                expect(result).toBeNull();
            });
            // with several messages, should return the first match
            it('should return the first match when there are several matches', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Nope', category: LoggingCategory.Configuration });
                logger.manualAdd({ level: LoggingLevel.Info, message: 'First match', category: LoggingCategory.Configuration });
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Second match', category: LoggingCategory.Configuration });
                const result = logger.findMessage('match');
                expect(result).not.toBeNull();
                expect(result!.message).toContain('First match');
            });
            // with several messages, should return null with no string matches
            it('should return null when there are no string matches', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Nope', category: LoggingCategory.Configuration });
                logger.manualAdd({ level: LoggingLevel.Info, message: 'First match', category: LoggingCategory.Configuration });
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Second match', category: LoggingCategory.Configuration });
                const result = logger.findMessage('nonexistent message');
                expect(result).toBeNull();
            });
            // with several messages, should return null with no regexp matches
            it('should return null when there are no RegExp matches', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Nope', category: LoggingCategory.Configuration });
                logger.manualAdd({ level: LoggingLevel.Info, message: 'First match', category: LoggingCategory.Configuration });
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Second match', category: LoggingCategory.Configuration });
                const result = logger.findMessage(/nonexistent message/);
                expect(result).toBeNull();
            });
            // should search on other parameters when message parameter is null
            it('should search on other parameters when message parameter is null', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Message with type and feature', category: LoggingCategory.Configuration, type: 'Type1', feature: 'Feature1' });
                const result = logger.findMessage(null, LoggingLevel.Info);
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message with type and feature');
                expect(result!.level).toBe(LoggingLevel.Info);
            });
        });
        describe('level parameter', () => {
            it('should find a message by level', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Info level message', category: LoggingCategory.Configuration });
                const result = logger.findMessage(null, LoggingLevel.Info);
                expect(result).not.toBeNull();
                expect(result!.level).toBe(LoggingLevel.Info);
            });
            it('should respect the log level filter', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Info level message', category: LoggingCategory.Configuration });
                logger.manualAdd({ level: LoggingLevel.Error, message: 'Error level message', category: LoggingCategory.Configuration });
                const result = logger.findMessage(null, LoggingLevel.Error);
                expect(result).not.toBeNull();
                expect(result!.level).toBe(LoggingLevel.Error);
            });
            it('should return null if the level does not match', () => {
                logger.manualAdd({ level: LoggingLevel.Info, message: 'Info level message', category: LoggingCategory.Configuration });
                const result = logger.findMessage(null, LoggingLevel.Error);
                expect(result).toBeNull();
            });
            
        });

        describe('category parameter', () => {
            it('should filter by category if provided', () => {
                logger.manualAdd({ level: LoggingLevel.Debug, message: 'Debug message for testing', category: LoggingCategory.Configuration });
                const result = logger.findMessage(null, null, LoggingCategory.Configuration);
                expect(result).not.toBeNull();
                expect(result!.category).toBe(LoggingCategory.Configuration);
            });            

            it('should return null when category does not match', () => {
                logger.manualAdd({ level: LoggingLevel.Debug, message: 'Another debug message', category: LoggingCategory.TypeMismatch });
                const result = logger.findMessage(null, null, LoggingCategory.Configuration);
                expect(result).toBeNull();
            });

            it('should return null when category is provided and there are no messages', () => {            
                const result = logger.findMessage(null, null, LoggingCategory.Configuration);
                expect(result).toBeNull();
            });
        });

        describe('more.type parameter', () => {
            it('should filter by type if provided', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with type',
                    category: LoggingCategory.Configuration, type: 'Type1'
                });
                const result = logger.findMessage(null, null, null, { type: 'Type1' });
                expect(result).not.toBeNull();
                expect(result!.type).toBe('Type1');
                expect(result!.typeAsString).toBe('Type1');
            });

            it('should return null if type does not match', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with mismatching type',
                    category: LoggingCategory.Configuration, type: 'Type2'
                });
                const result = logger.findMessage(null, null, null, { type: 'Type1' });
                expect(result).toBeNull();
            });

            // type is a function with constructor
            it('should filter by type if provided as a function', () => {
                class TestClass { }
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with type',
                    category: LoggingCategory.Configuration, type: TestClass
                });
                const result = logger.findMessage(null, null, null, { type: TestClass });
                expect(result).not.toBeNull();
                expect(result!.type).toBeInstanceOf(Function);
                expect(result!.typeAsString).toBe('TestClass');
            });
            // type is a function with constructor that does not match
            it('should return null if type does not match a function', () => {
                class TestClass { }
                class TestClass2 { }
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with type',
                    category: LoggingCategory.Configuration, type: TestClass2
                });
                const result = logger.findMessage(null, null, null, { type: TestClass });
                expect(result).toBeNull();
            });

            // type is a regexp 
            it('should filter by type if provided as a RegExp', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with type',
                    category: LoggingCategory.Configuration, type: 'Type1'
                });
                const result = logger.findMessage(null, null, null, { type: /Type/ });
                expect(result).not.toBeNull();
                expect(result!.type).toBe('Type1');
                expect(result!.typeAsString).toBe('Type1');
            });
            // type is a regexp that does not match
            it('should return null if type does not match a RegExp', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with type',
                    category: LoggingCategory.Configuration, type: 'Type1'
                });
                const result = logger.findMessage(null, null, null, { type: /Type2/ });
                expect(result).toBeNull();
            });

            it('should return the first message with the type', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with type2',
                    category: LoggingCategory.Configuration, type: 'Type2'
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with type',
                    category: LoggingCategory.Configuration, type: 'Type1'
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Another message with type',
                    category: LoggingCategory.Configuration, type: 'Type1'
                });
                const result = logger.findMessage(null, null, null, { type: 'Type1' });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message with type');
            });

            it('should return null if no message has the type and there are multiple messages', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with type2',
                    category: LoggingCategory.Configuration, type: 'Type2'
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Another message with type2',
                    category: LoggingCategory.Configuration, type: 'Type2'
                });
                const result = logger.findMessage(null, null, null, { type: 'Type1' });
                expect(result).toBeNull();
            });

        });
        describe('more.feature parameter', () => {
            it('should filter by feature if provided', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with feature',
                    category: LoggingCategory.Configuration, feature: 'Feature1'
                });
                const result = logger.findMessage(null, null, null, { feature: 'Feature1' });
                expect(result).not.toBeNull();
                expect(result!.feature).toBe('Feature1');
            });

            it('should return null if feature does not match', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with mismatching feature',
                    category: LoggingCategory.Configuration, feature: 'Feature2'
                });
                const result = logger.findMessage(null, null, null, { feature: 'Feature1' });
                expect(result).toBeNull();
            });

            // feature is a regexp 
            it('should filter by feature if provided as a RegExp', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with feature',
                    category: LoggingCategory.Configuration, feature: 'Feature1'
                });
                const result = logger.findMessage(null, null, null, { feature: /Feature/ });
                expect(result).not.toBeNull();
                expect(result!.feature).toBe('Feature1');
            });
            // feature is a regexp that does not match
            it('should return null if feature does not match a RegExp', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with feature',
                    category: LoggingCategory.Configuration, feature: 'Feature1'
                });
                const result = logger.findMessage(null, null, null, { feature: /Feature2/ });
                expect(result).toBeNull();
            });

            it('should return the first message with the feature', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with feature2',
                    category: LoggingCategory.Configuration, feature: 'Feature2'
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with feature',
                    category: LoggingCategory.Configuration, feature: 'Feature1'
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Another message with feature',
                    category: LoggingCategory.Configuration, feature: 'Feature1'
                });
                const result = logger.findMessage(null, null, null, { feature: 'Feature1' });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message with feature');
            });

            it('should return null if no message has the feature and there are multiple messages', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with feature2',
                    category: LoggingCategory.Configuration, feature: 'Feature2'
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Another message with feature2',
                    category: LoggingCategory.Configuration, feature: 'Feature2'
                });
                const result = logger.findMessage(null, null, null, { feature: 'Feature1' });
                expect(result).toBeNull();
            });

        });
        describe('more.identity parameter', () => {
            it('should filter by identity if provided', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with identity',
                    category: LoggingCategory.Configuration, identity: 'Identity1'
                });
                const result = logger.findMessage(null, null, null, { identity: 'Identity1' });
                expect(result).not.toBeNull();
                expect(result!.identity).toBe('Identity1');
            });

            it('should return null if identity does not match', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with mismatching identity',
                    category: LoggingCategory.Configuration, identity: 'Identity2'
                });
                const result = logger.findMessage(null, null, null, { identity: 'Identity1' });
                expect(result).toBeNull();
            });

            // identity is a regexp 
            it('should filter by identity if provided as a RegExp', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with identity',
                    category: LoggingCategory.Configuration, identity: 'Identity1'
                });
                const result = logger.findMessage(null, null, null, { identity: /Identity/ });
                expect(result).not.toBeNull();
                expect(result!.identity).toBe('Identity1');
            });
            // identity is a regexp that does not match
            it('should return null if identity does not match a RegExp', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with identity',
                    category: LoggingCategory.Configuration, identity: 'Identity1'
                });
                const result = logger.findMessage(null, null, null, { identity: /Identity2/ });
                expect(result).toBeNull();
            });
            // 3 captures, 2 with identity, 1 without
            it('should return the first message with the identity', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with identity2',
                    category: LoggingCategory.Configuration, identity: 'Identity2'
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with identity',
                    category: LoggingCategory.Configuration, identity: 'Identity1'
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Another message with identity',
                    category: LoggingCategory.Configuration
                });
                const result = logger.findMessage(null, null, null, { identity: 'Identity1' });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message with identity');
            });
            // multiple captures, no identity matches
            it('should return null if no message has the identity and there are multiple messages', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with identity2',
                    category: LoggingCategory.Configuration, identity: 'Identity2'
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Another message with identity2',
                    category: LoggingCategory.Configuration, identity: 'Identity2'
                });
                const result = logger.findMessage(null, null, null, { identity: 'Identity1' });
                expect(result).toBeNull();
            });
        });
        describe('more.hasData parameter', () => {
            it('should return null if hasData is true and there is no data', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with data',
                    category: LoggingCategory.Configuration
                });
                const result = logger.findMessage(null, null, null, { hasData: true });
                expect(result).toBeNull();
            });
            it('should return the first message with data if hasData is true', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Another message with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                const result = logger.findMessage(null, null, null, { hasData: true });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message with data');
            });
            it('should return the first message without data if hasData is false', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message1 with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message2 without data',
                    category: LoggingCategory.Configuration
                });
                const result = logger.findMessage(null, null, null, { hasData: false });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message2 without data');
            });
            // hasData=false finds data: null
            it('should return the first message without data if hasData is false and data is null', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message1 with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message2 without data',
                    category: LoggingCategory.Configuration, data: null!
                });
                const result = logger.findMessage(null, null, null, { hasData: false });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message2 without data');
            });
            // hasData is ignored when the FindMoreCapturedLogDetails object also has data property setup
            it('should ignore hasData when data property is also set', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message1 with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message2 without data',
                    category: LoggingCategory.Configuration
                });
                const result = logger.findMessage(null, null, null, { hasData: false, data: { key: 'value' } });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message1 with data');
            });
        });

        describe('more.data parameter', () => {
            it('should return null if data does not match', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                const result = logger.findMessage(null, null, null, { data: { key: 'nonexistent value' } });
                expect(result).toBeNull();
            });
            it('should return the first message with matching data', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Another message with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                const result = logger.findMessage(null, null, null, { data: { key: 'value' } });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message with data');
            });
            it('should return the first message with matching data when there are multiple matches', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Another message with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Yet another message with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                const result = logger.findMessage(null, null, null, { data: { key: 'value' } });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message with data');
            });
            it('should return null if no message has the data and there are multiple messages', () => {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Another message with data',
                    category: LoggingCategory.Configuration, data: { key: 'value' }
                });
                const result = logger.findMessage(null, null, null, { data: { key: 'nonexistent value' } });
                expect(result).toBeNull();
            });
        });

        describe('combined parameters', () => {
            function addData(): void
            {
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message1',
                    category: LoggingCategory.Configuration, type: 'Type1',
                    feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                // change message
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message2',
                    category: LoggingCategory.Configuration, type: 'Type1',
                    feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                // change data.key.value
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message3',
                    category: LoggingCategory.Configuration, type: 'Type1',
                    feature: 'Feature1', identity: 'Identity1', data: { key: 'value2' }
                });
                // omit data
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message4',
                    category: LoggingCategory.Configuration, type: 'Type1',
                    feature: 'Feature1', identity: 'Identity1'
                });
                // change identity
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message4',
                    category: LoggingCategory.Configuration, type: 'Type1',
                    feature: 'Feature1', identity: 'Identity2', data: { key: 'value1' }
                });
                // change feature
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message5',
                    category: LoggingCategory.Configuration, type: 'Type1',
                    feature: 'Feature2', identity: 'Identity1', data: { key: 'value1' }
                });
                // change type
                logger.manualAdd({
                    level: LoggingLevel.Info, message: 'Message6',
                    category: LoggingCategory.Configuration, type: 'Type2',
                    feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                }); 
                // level=debug and category = Configuration
                logger.manualAdd({
                    level: LoggingLevel.Debug, message: 'Message7',
                    category: LoggingCategory.Configuration, type: 'Type1',
                    feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                // level=error and category = TypeMismatch
                logger.manualAdd({
                    level: LoggingLevel.Error, message: 'Message8',
                    category: LoggingCategory.TypeMismatch, type: 'Type1',
                    feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
            }
            // write tests for all possible combinations of parameters
            it('should find a message with all parameters matching', () => {
                addData();
                const result = logger.findMessage('Message1', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message1');
            });
            it('should return null if message does not match, but has correct Level and Category', () => {
                addData();
                const result = logger.findMessage('Nonexistent message', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).toBeNull();
                expect(logger.findMessage(null, LoggingLevel.Info, LoggingCategory.Configuration)).toBeTruthy();
            });
            it('should return null if level does not match', () => {
                addData();
                const result = logger.findMessage('Message1', LoggingLevel.Debug, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).toBeNull();
            });
            it('should return null if category does not match', () => {
                addData();
                const result = logger.findMessage('Message1', LoggingLevel.Info, LoggingCategory.TypeMismatch, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).toBeNull();
            });
            it('should return null if type does not match', () => {
                addData();
                const result = logger.findMessage('Message1', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type2', feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).toBeNull();
            });
            it('should return null if feature does not match', () => {
                addData();
                const result = logger.findMessage('Message1', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature2', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).toBeNull();
            });
            it('should return null if identity does not match', () => {
                addData();
                const result = logger.findMessage('Message1', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity2', data: { key: 'value1' }
                });
                expect(result).toBeNull();
            });
            it('should return null if data does not match', () => {
                addData();
                const result = logger.findMessage('Message1', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity1', data: { key: 'value2' }
                });
                expect(result).toBeNull();
            });
            it('should return the first message with the correct message and level', () => {
                addData();
                const result = logger.findMessage('Message4', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity1'
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message4');
            });
            it('should return the first message with the correct message and category', () => {
                addData();
                const result = logger.findMessage('Message4', null, LoggingCategory.Configuration);
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message4');
            });
            it('should return the first message with the correct message and type', () => {
                addData();
                const result = logger.findMessage('Message4', null, null, {
                    type: 'Type1'
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message4');
            });
            it('should return the first message with the correct message and feature', () => {
                addData();
                const result = logger.findMessage('Message4', null, null, {
                    feature: 'Feature1'
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message4');
            });
            it('should return the first message with the correct message and identity', () => {
                addData();
                const result = logger.findMessage('Message4', null, null, {
                     identity: 'Identity1'
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message4');
            });
            it('should return the first message with the correct message and data', () => {
                addData();
                const result = logger.findMessage('Message4', null, null, {
                    data: { key: 'value1' }
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message4');
            });
            it('should return the first message with the correct level and category', () => {
                addData();
                const result = logger.findMessage(null, LoggingLevel.Error, LoggingCategory.TypeMismatch);
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message8');
            });
            it('should return the first message with the correct level and type', () => {
                addData();
                const result = logger.findMessage(null, LoggingLevel.Info, null, {
                    type: 'Type2'   // first in message6
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message6');
            });
            it('should return the first message with the correct level and feature', () => {
                addData();
                const result = logger.findMessage('Message4', LoggingLevel.Info, null, {
                    feature: 'Feature1'
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message4');
            });
            it('should return the first message with the correct category and identity', () => {
                addData();
                const result = logger.findMessage(null, null, LoggingCategory.Configuration, {
                    identity: 'Identity2'   // first in Message4
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message4');
            });
            it('exact match of all parameters to Message5', () => {
                addData();
                // level: LoggingLevel.Info, message: 'Message5',
                // category: LoggingCategory.Configuration, type: 'Type1',
                // feature: 'Feature2', identity: 'Identity1', data: { key: 'value1' }
                
                const result = logger.findMessage('Message5', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature2', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message5');
            });
            // find message2 wtih all exact matches
            it('exact match of all parameters to Message2', () => {
                addData();
                // level: LoggingLevel.Info, message: 'Message2',
                // category: LoggingCategory.Configuration, type: 'Type1',
                // feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                
                const result = logger.findMessage('Message2', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message2');
            });
            // find message3 with all exact matches
            it('exact match of all parameters to Message3', () => {
                addData();
                // level: LoggingLevel.Info, message: 'Message3',
                // category: LoggingCategory.Configuration, type: 'Type1',
                // feature: 'Feature1', identity: 'Identity1', data: { key: 'value2' }
                
                const result = logger.findMessage('Message3', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity1', data: { key: 'value2' }
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message3');
            });
            // find message6 with all exact matches
            it('exact match of all parameters to Message6', () => {
                addData();
                // level: LoggingLevel.Info, message: 'Message6',
                // category: LoggingCategory.Configuration, type: 'Type2',
                // feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                
                const result = logger.findMessage('Message6', LoggingLevel.Info, LoggingCategory.Configuration, {
                    type: 'Type2', feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message6');
            });
            // find message7 with all exact matches
            it('exact match of all parameters to Message7', () => {
                addData();
                // level: LoggingLevel.Debug, message: 'Message7',
                // category: LoggingCategory.Configuration, type: 'Type1',
                // feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                
                const result = logger.findMessage('Message7', LoggingLevel.Debug, LoggingCategory.Configuration, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message7');
            });
            // find message8 with all exact matches
            it('exact match of all parameters to Message8', () => {
                addData();
                // level: LoggingLevel.Error, message: 'Message8',
                // category: LoggingCategory.TypeMismatch, type: 'Type1',
                // feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                
                const result = logger.findMessage('Message8', LoggingLevel.Error, LoggingCategory.TypeMismatch, {
                    type: 'Type1', feature: 'Feature1', identity: 'Identity1', data: { key: 'value1' }
                });
                expect(result).not.toBeNull();
                expect(result!.message).toContain('Message8');
            });


        });

    });
});