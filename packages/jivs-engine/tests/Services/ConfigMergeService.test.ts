import { ConsoleLoggerService } from '../../src/Services/ConsoleLoggerService';
import { ConditionConflictIdentifierHandler, PropertyConfigMergeServiceHandlerResult } from '../../src/Interfaces/ConfigMergeService';
import { MergeIdentity, PropertyConflictRule } from '../../src/Interfaces/ConfigMergeService';
import { LoggingLevel, logGatheringHandler } from '../../src/Interfaces/LoggerService';
import { CodingError } from '../../src/Utilities/ErrorHandling';
import { ConfigMergeServiceBase, ValidatorConfigMergeService, ValueHostConfigMergeService } from '../../src/Services/ConfigMergeService';
import { CapturingLogger } from '../../src/Support/CapturingLogger';
import { ConditionType } from '../../src/Conditions/ConditionTypes';
import { ValueHostConfig } from '../../src/Interfaces/ValueHost';
import { ValueHostType } from '../../src/Interfaces/ValueHostFactory';
import { LookupKey } from '../../src/DataTypes/LookupKeys';
import { ValidatorConfig } from '../../src/Interfaces/Validator';
import { ValidatorsValueHostBaseConfig } from '../../src/Interfaces/ValidatorsValueHostBase';
import { LessThanValueConditionConfig } from '../../src/Conditions/ConcreteConditions';
import { InputValueHostConfig } from '../../src/Interfaces/InputValueHost';
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import { createValidationServicesForTesting } from '../../src/Support/createValidationServicesForTesting';

function createServices(): { logger: CapturingLogger, services: IValidationServices }
{
    let services = createValidationServicesForTesting();    // has both resolvers created
    return { logger: setupLogger(services, LoggingLevel.Error), services: services };
}
function setupLogger(services: IValidationServices, level: LoggingLevel): CapturingLogger
{
    let logger = new CapturingLogger();
    logger.chainedLogger = new ConsoleLoggerService();
    services.loggerService = logger;
    return logger;
}
describe('ConfigMergeServiceBase using a subclass to expose protected members', () => {
    class Publicify_ConfigMergeServiceBase extends
        ConfigMergeServiceBase<object> {
        constructor() {
            super();

        }

        protected publicify_log(level: LoggingLevel, gatherFn: logGatheringHandler): void {
            super.logger.log(level, gatherFn);
        }

        public publicify_mergeConfigs(source: object, destination: object, identity: MergeIdentity): void {
            super.mergeConfigs(source, destination, identity);
        }
        public publicify_mergeProperty(propertyName: string, rule: PropertyConflictRule<object>,
            source: object, destination: object, identity: MergeIdentity): void {
            super.mergeProperty(propertyName, rule, source, destination, identity);
        }

    }



    describe('constructor', () => {
        test('create without exception and have assigned the logger to CapturingLogger ', () => {
            let testItem: Publicify_ConfigMergeServiceBase;
            expect(() => testItem = new Publicify_ConfigMergeServiceBase()).not.toThrow();
        });
    });
    describe('setPropertyConflictRule', () => {
        test('Set property as locked once allowed and saved but throws on a second attempt', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            expect(() => testItem.setPropertyConflictRule('A', 'locked')).not.toThrow();
            expect(testItem.getPropertyConflictRule('A')).toBe('locked');
            expect(() => testItem.setPropertyConflictRule('A', 'locked')).toThrow(CodingError);
        });
        test('Set property as nochange allowed on multiple attempts', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            expect(() => testItem.setPropertyConflictRule('A', 'nochange')).not.toThrow();
            expect(testItem.getPropertyConflictRule('A')).toBe('nochange');
            expect(() => testItem.setPropertyConflictRule('A', 'nochange')).not.toThrow();
        });
        test('Set property as replace allowed on multiple attempts', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            expect(() => testItem.setPropertyConflictRule('A', 'replace')).not.toThrow();
            expect(testItem.getPropertyConflictRule('A')).toBe('replace');
            expect(() => testItem.setPropertyConflictRule('A', 'replace')).not.toThrow();
        });
        test('Set property as replaceExceptNull allowed on multiple attempts', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            expect(() => testItem.setPropertyConflictRule('A', 'replaceExceptNull')).not.toThrow();
            expect(testItem.getPropertyConflictRule('A')).toBe('replaceExceptNull');
            expect(() => testItem.setPropertyConflictRule('A', 'replaceExceptNull')).not.toThrow();
        });
        test('Set property as delete allowed on multiple attempts', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            expect(() => testItem.setPropertyConflictRule('A', 'delete')).not.toThrow();
            expect(testItem.getPropertyConflictRule('A')).toBe('delete');
            expect(() => testItem.setPropertyConflictRule('A', 'delete')).not.toThrow();
        });
        test('Set property as replaceOrDelete allowed on multiple attempts', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            expect(() => testItem.setPropertyConflictRule('A', 'replaceOrDelete')).not.toThrow();
            expect(testItem.getPropertyConflictRule('A')).toBe('replaceOrDelete');
            expect(() => testItem.setPropertyConflictRule('A', 'replaceOrDelete')).not.toThrow();
        });
        test('Set property as a function allowed only once no matter the next rule value', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            let fn = () => { return { useValue: 'first' } };
            expect(() => testItem.setPropertyConflictRule('A', fn)).not.toThrow();
            let result = testItem.getPropertyConflictRule('A') as () => PropertyConfigMergeServiceHandlerResult;
            expect(typeof result).toBe('function');
            expect(result()).toEqual({ useValue: 'first' });
            let fn2 = () => { return { useValue: 'second' } };
            expect(() => testItem.setPropertyConflictRule('A', fn2)).toThrow(CodingError);
            expect(() => testItem.setPropertyConflictRule('A', 'nochange')).toThrow(CodingError);
            expect(() => testItem.setPropertyConflictRule('A', 'delete')).toThrow(CodingError);
            expect(() => testItem.setPropertyConflictRule('A', 'locked')).toThrow(CodingError);
            expect(() => testItem.setPropertyConflictRule('A', 'replace')).toThrow(CodingError);
            expect(() => testItem.setPropertyConflictRule('A', 'replaceOrDelete')).toThrow(CodingError);
            expect(() => testItem.setPropertyConflictRule('A', 'replaceExceptNull')).toThrow(CodingError);

        });
        test('Set several properties once and all are saved', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            testItem.setPropertyConflictRule('A', 'locked');
            testItem.setPropertyConflictRule('B', 'nochange');
            testItem.setPropertyConflictRule('C', 'replace');
            testItem.setPropertyConflictRule('D', 'replaceOrDelete');
            testItem.setPropertyConflictRule('E', 'delete');
            testItem.setPropertyConflictRule('F', 'replaceExceptNull');
            testItem.setPropertyConflictRule('G', () => { return { useValue: 'result' } });

            expect(testItem.getPropertyConflictRule('A')).toBe('locked');
            expect(testItem.getPropertyConflictRule('B')).toBe('nochange');
            expect(testItem.getPropertyConflictRule('C')).toBe('replace');
            expect(testItem.getPropertyConflictRule('D')).toBe('replaceOrDelete');
            expect(testItem.getPropertyConflictRule('E')).toBe('delete');
            expect(testItem.getPropertyConflictRule('F')).toBe('replaceExceptNull');
            let result = testItem.getPropertyConflictRule('G') as () => PropertyConfigMergeServiceHandlerResult;
            expect(typeof result).toBe('function');
            expect(result()).toEqual({ useValue: 'result' });
        });
    });
    describe('mergeProperty', () => {
        function testMergeProperty(rule: PropertyConflictRule<object>,
            source: object, destination: object, expected: object,
            logContains?: string
        ) {
            let expectedSource = { ...source };
            
            let testItem = new Publicify_ConfigMergeServiceBase();
            let setup = createServices();
            testItem.services = setup.services;
            setup.logger.minLevel = LoggingLevel.Debug;
            const propertyName = 'A';
            expect(() => testItem.publicify_mergeProperty(propertyName, rule,
                source, destination, { valueHostName: 'X' }
            )).not.toThrow();
            expect(destination).toEqual(expected);
            expect(source).toEqual(expectedSource);
            if (logContains)
                expect(setup.logger.findMessage(logContains, null, null)).toBeTruthy();

        }
        test('nochange keeps destination intact', () => {
            testMergeProperty('nochange', { A: 'ABC' }, { A: 'XYZ' }, { A: 'XYZ' }, 'Rule prevents changes');
        });
        test('locked keeps destination intact', () => {
            testMergeProperty('locked', { A: 'ABC' }, { A: 'XYZ' }, { A: 'XYZ' }, 'Rule prevents changes');
        });
        test('replace updates the property in the destination with that of the source', () => {
            testMergeProperty('replace', { A: 'ABC' }, { A: 'XYZ' }, { A: 'ABC' }, 'replaced');
        });
        test('replace does not change destination if values are the same. No logging for "replaced".', () => {
            testMergeProperty('replace', { A: 'XYZ' }, { A: 'XYZ' }, { A: 'XYZ' });
        });

        test('replaceExceptNull updates the property in the destination with that of the source while the source is not null or undefined', () => {
            testMergeProperty('replaceExceptNull', { A: 'ABC' }, { A: 'XYZ' }, { A: 'ABC' }, 'replaced');
            testMergeProperty('replaceExceptNull', { A: null }, { A: 'XYZ' }, { A: 'XYZ' });
            testMergeProperty('replaceExceptNull', { A: undefined }, { A: 'XYZ' }, { A: 'XYZ' });
        });
        test('delete updates the property in the destination', () => {
            testMergeProperty('delete', { A: 'ABC' }, { A: 'XYZ' }, {}, 'deleted');
        });

        test('replaceOrDelete and source has non-null updates the property in the destination with that of the source', () => {
            testMergeProperty('replaceOrDelete', { A: 'ABC' }, { A: 'XYZ' }, { A: 'ABC' }, 'replaced');
        });
        test('replaceOrDelete and source has null deletes the property in the destination', () => {
            testMergeProperty('replaceOrDelete', { A: null }, { A: 'XYZ' }, {}, 'deleted');
        });

        test('function returns nochange keeps destination intact', () => {
            testMergeProperty((source, destination, identity) => {
                return { useAction: 'nochange' };
            },
                { A: 'ABC' }, { A: 'XYZ' }, { A: 'XYZ' }, 'Rule prevents changes');
        });
        test('function returns replace changes the property in the destination', () => {
            testMergeProperty((source, destination, identity) => {
                return { useAction: 'replace' };
            },
                { A: 'ABC' }, { A: 'XYZ' }, { A: 'ABC' }, 'replaced');
        });
        test('function returns delete removes the property from the destination', () => {
            testMergeProperty((source, destination, identity) => {
                return { useAction: 'delete' };
            },
                { A: 'ABC' }, { A: 'XYZ' }, {}, 'delete');
        });
        test('function returns replaceOrDelete and source value is not null changes the property in the destination', () => {
            testMergeProperty((source, destination, identity) => {
                return { useAction: 'replaceOrDelete' };
            },
                { A: 'ABC' }, { A: 'XYZ' }, { A: 'ABC' }, 'replaced');
        });
        test('function returns replaceOrDelete and source value is null removes the property from the destination', () => {
            testMergeProperty((source, destination, identity) => {
                return { useAction: 'replaceOrDelete' };
            },
                { A: null }, { A: 'XYZ' }, {}, 'deleted');
        });

        test('function returns a value replaces property in the destination', () => {
            testMergeProperty((source, destination, identity) => {
                return { useValue: 'DEF' };
            },
                { A: 'ABC' }, { A: 'XYZ' }, { A: 'DEF' }, 'replaced');
        });
        test('unknown command throws', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            expect(() => testItem.publicify_mergeProperty('A', 'UNKNOWN' as any,
                { A: 'ABC' }, { A: 'XYZ' }, { valueHostName: '!' })).toThrow(/Unknown rule/);
        })
    });

    describe('mergeConfigs', () => {
        function testMerge(testItem: Publicify_ConfigMergeServiceBase,
            source: object, destination: object, expected: object
        ) {
            let expectedSource = { ...source };
            let setup = createServices();
            testItem.services = setup.services;
            setup.logger.minLevel = LoggingLevel.Debug;

            expect(() => testItem.publicify_mergeConfigs(
                source, destination, { valueHostName: 'X' }
            )).not.toThrow();
            expect(destination).toEqual(expected);
            expect(source).toEqual(expectedSource);
        }
        test('Assign all properties to empty destination from those found in source when no rules applied', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            testMerge(testItem, { 'A': 1, 'B': false, 'C': null },
                {},
                { 'A': 1, 'B': false, 'C': null });
        });
        test('Replace all properties in destination from those found in source when no rules applied', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            testMerge(testItem, { 'A': 1, 'B': false, 'C': null },
                { 'A': 0, 'B': true, 'C': 'test' },
                { 'A': 1, 'B': false, 'C': null });
        });
        test('With B=nochange, Replace all properties except B in destination from those found in source when no rules applied', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            testItem.setPropertyConflictRule('B', 'nochange');
            testMerge(testItem, { 'A': 1, 'B': false, 'C': null },
                { 'A': 0, 'B': true, 'C': 'test' },
                { 'A': 1, 'B': true, 'C': null });
        });

        test('With empty source, no change to destination', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            testMerge(testItem, {},
                { 'A': 0, 'B': true, 'C': 'test' },
                { 'A': 0, 'B': true, 'C': 'test' });
        });
        test('With different properties on both source and destination, effectively merge into destination', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            testMerge(testItem, { 'A1': 1, 'B1': false, 'C1': null },
                { 'A2': 0, 'B2': true, 'C2': 'test' },
                { 'A1': 1, 'B1': false, 'C1': null, 'A2': 0, 'B2': true, 'C2': 'test' });
        });
        test('delete rule on "B" applied when "B" is only found on the destination', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            testItem.setPropertyConflictRule('B', 'delete');
            testMerge(testItem, { 'A': 1, 'C': null },
                { 'A': 0, 'B': true, 'C': 'test' },
                { 'A': 1, 'C': null });
        });
        test('delete rule on "B" applied when "B" is only found in both source and destination', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            testItem.setPropertyConflictRule('B', 'delete');
            testMerge(testItem, { 'A': 1, 'B': false, 'C': null },
                { 'A': 0, 'B': true, 'C': 'test' },
                { 'A': 1, 'C': null });
        });       
        test('delete rule has no effect when "B" is only found in source ', () => {
            let testItem = new Publicify_ConfigMergeServiceBase();
            testItem.setPropertyConflictRule('B', 'delete');
            testMerge(testItem, { 'A': 1, 'B': false, 'C': null },
                { 'A': 0, 'C': 'test' },
                { 'A': 1, 'C': null });
        });                
    });
});

describe('ValueHostConfigMergeService', () => {
    describe('constructor and setting up', () => {
        class Publicify_ValueHostConfigMergeService extends ValueHostConfigMergeService {

        }
        test('constructor sets default propertyConflictRules and with null parameter, uses ValidatorConfigMergeService', () => {
            let testItem = new Publicify_ValueHostConfigMergeService();
            expect(testItem.getPropertyConflictRule('name')).toBe('locked');
            expect(testItem.getPropertyConflictRule('validatorConfigs')).toBe('locked');
            expect(typeof testItem.getPropertyConflictRule('valueHostType')).toBe('function');
            expect(testItem.getPropertyConflictRule('dataType')).toBe('replaceExceptNull');
            expect(testItem.getPropertyConflictRule('label')).toBeUndefined();
        });
        test('constructor sets default propertyConflictRules and with null parameter, uses ValidatorConfigMergeService', () => {
            let testItem = new Publicify_ValueHostConfigMergeService();
            expect(testItem.getPropertyConflictRule('name')).toBe('locked');
            expect(testItem.getPropertyConflictRule('validatorConfigs')).toBe('locked');
            expect(typeof testItem.getPropertyConflictRule('valueHostType')).toBe('function');
            expect(testItem.getPropertyConflictRule('dataType')).toBe('replaceExceptNull');
            expect(testItem.getPropertyConflictRule('label')).toBeUndefined();
        });

    });
    describe('merge', () => {
        function testResolve(source: ValueHostConfig, destination: ValueHostConfig,
            expectedDestionation: ValueHostConfig,
            logContains?: string) {
            let setup = createServices();
            let testItem = setup.services.valueHostConfigMergeService;
            setup.logger.minLevel = LoggingLevel.Debug;

            let expectedSource = { ...source };
            testItem.merge(source, destination);
            expect(destination).toEqual(expectedDestionation);
            expect(source).toEqual(expectedSource);
            if (logContains)
                expect(setup.logger.findMessage(logContains, null)).toBeTruthy();
        }
        test('Same valueHostName, no validatorConfigs, no custom rules. Copies everything except valueHostType and valueHostName', () => {
            testResolve({
                valueHostType: ValueHostType.Static,
                name: 'Field1',
                dataType: LookupKey.Date,
                label: 'Birthdate',
                labell10n: 'BD'
            },
                {
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: LookupKey.DateTime,
                    label: 'Field 1',
                    initialValue: 'not in source'
                },
                {
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: LookupKey.Date,
                    label: 'Birthdate',
                    labell10n: 'BD',
                    initialValue: 'not in source'
                });
        });
        test('Different valueHostName never changes destination', () => {
            testResolve({
                valueHostType: ValueHostType.Static,
                name: 'Field1',
                dataType: LookupKey.Date,
                label: 'Birthdate',
                labell10n: 'BD'
            },
                {
                    valueHostType: ValueHostType.Static,
                    name: 'Field2',
                    dataType: LookupKey.DateTime,
                    label: 'Field 2',
                    initialValue: 'not in source'
                },
                {
                    valueHostType: ValueHostType.Static,
                    name: 'Field2',
                    dataType: LookupKey.DateTime,
                    label: 'Field 2',
                    initialValue: 'not in source'
                });
        });
        test('InputValueHost is source and PropertyValueHost is destination. ValueHostType changed to Input', () => {
            testResolve({
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                dataType: LookupKey.Date,
                label: 'Birthdate',
                labell10n: 'BD'
            },
                {
                    valueHostType: ValueHostType.Property,
                    name: 'Field1',
                    dataType: LookupKey.DateTime,
                    label: 'Field 1',
                    initialValue: 'not in source'
                },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.Date,
                    label: 'Birthdate',
                    labell10n: 'BD',
                    initialValue: 'not in source'
                },
                'valueHostType replaced');
        });
        test('InputValueHost is source and StaticValueHost is destination. ValueHostType not changed and reported in log', () => {
            testResolve({
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                dataType: LookupKey.Date,
                label: 'Birthdate',
                labell10n: 'BD'
            },
                {
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: LookupKey.DateTime,
                    label: 'Field 1',
                    initialValue: 'not in source'
                },
                {
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: LookupKey.Date,
                    label: 'Birthdate',
                    labell10n: 'BD',
                    initialValue: 'not in source'
                },
                'Will not change ValueHostType from Static to Input.');
        });
        test('dataType of source is null. No change to the destination datatype', () => {
            testResolve({
                valueHostType: ValueHostType.Static,
                name: 'Field1',
                dataType: null!,
                label: 'Birthdate',
                labell10n: 'BD'
            },
                {
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: LookupKey.DateTime,
                    label: 'Field 1',
                    initialValue: 'not in source'
                },
                {
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: LookupKey.DateTime,
                    label: 'Birthdate',
                    labell10n: 'BD',
                    initialValue: 'not in source'
                });
        });        
        test('dataType of source is undefined. No change to the destination datatype', () => {
            testResolve({
                valueHostType: ValueHostType.Static,
                name: 'Field1',
                dataType: undefined,
                label: 'Birthdate',
                labell10n: 'BD'
            },
                {
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: LookupKey.DateTime,
                    label: 'Field 1',
                    initialValue: 'not in source'
                },
                {
                    valueHostType: ValueHostType.Static,
                    name: 'Field1',
                    dataType: LookupKey.DateTime,
                    label: 'Birthdate',
                    labell10n: 'BD',
                    initialValue: 'not in source'
                });
        });                
        //NOTE: Most of the testing of validatorConfigs is deferred to ValidatorConfigMergeService tests
        // This mostly demonstrates the interchange between ValueHostConfigMergeService and ValidatorConfigMergeService
        test('No conflicting validators. Copies everything except valueHostType and valueHostName', () => {
            testResolve(<InputValueHostConfig>{
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                dataType: LookupKey.Date,
                label: 'Birthdate',
                labell10n: 'BD',
                validatorConfigs: [
                    {
                        conditionConfig: <LessThanValueConditionConfig>{
                            conditionType: ConditionType.LessThanValue,
                            value: new Date(2000, 0, 1),
                            valueHostName: null
                        }
                    }
                ]
            },
                <InputValueHostConfig>{
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.DateTime,
                    label: 'Field 1',
                    initialValue: 'not in source',
                    validatorConfigs: [
                        {
                            conditionConfig: {
                                conditionType: ConditionType.NotNull
                            }
                        }
                    ]
                },
                <InputValueHostConfig>{
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.Date,
                    label: 'Birthdate',
                    labell10n: 'BD',
                    initialValue: 'not in source',
                    validatorConfigs: [
                        {
                            conditionConfig: {
                                conditionType: ConditionType.NotNull
                            }
                        },
                        {
                            conditionConfig: <LessThanValueConditionConfig>{
                                conditionType: ConditionType.LessThanValue,
                                value: new Date(2000, 0, 1),
                                valueHostName: null
                            }
                        }
    
                    ]                    
                });
        });        
    });
    describe('identifyValueHostConflict', () => {
        test('Matches based on the field name. Matches return the actual instance found. Non-matches return undefined.', () => {
            let testItem = new ValueHostConfigMergeService();
            const source: InputValueHostConfig = {
                name: 'Field1',
                dataType: 'String',
                validatorConfigs: null
            };
            const dest1: InputValueHostConfig = {
                name: 'Field1',
                dataType: 'Number', // intentionally different from source
                validatorConfigs: []
            };
            const dest2: InputValueHostConfig = {
                name: 'Field2',
                dataType: 'Number', 
                validatorConfigs: []
            };            
            const destinations: Array<InputValueHostConfig> = [
                dest1, dest2
            ];
            expect(testItem.identifyValueHostConflict(source, destinations)).toBe(dest1);
            expect(testItem.identifyValueHostConflict({ ...source, name: 'Field2' }, destinations)).toBe(dest2);
            expect(testItem.identifyValueHostConflict({ ...source, name: 'Field3' }, destinations)).toBeUndefined();
        });
    });
});
describe('ValidatorConfigMergeService', () => {
    describe('constructor and setting up', () => {

        test('constructor sets default propertyConflictRules', () => {
            let testItem = new ValidatorConfigMergeService();
            expect(testItem.getPropertyConflictRule('validatorType')).toBe('locked');
            expect(typeof testItem.getPropertyConflictRule('conditionConfig')).toBe('function');
            expect(testItem.getPropertyConflictRule('conditionCreator')).toBe('nochange');
            expect(testItem.getPropertyConflictRule('errorCode')).toBe('nochange');
            expect(testItem.getPropertyConflictRule('errorMessage')).toBeUndefined();
            expect(testItem.identifyHandler).toBe(testItem.identifyValidatorConflict);
        });

        test('identityHandler set should be returned on get', () => {
            let testItem = new ValidatorConfigMergeService();
            let handler: ConditionConflictIdentifierHandler = (validatorSrc, validatorsInDest, identity) => { return undefined; }
            testItem.identifyHandler = handler;
            expect(testItem.identifyHandler).toBe(handler);
        });
    });
    describe('identifyValidatorConflict', () => {
        test('source.errorCode not found in empty destination array returns undefined', () => {
            let testItem = new ValidatorConfigMergeService();
            expect(testItem.identifyValidatorConflict({
                errorCode: '1',
                conditionConfig: null,
            },
                [],
                { valueHostName: 'Field1' })).toBeUndefined();
        });
        test('source.errorCode not found in populated destination array returns undefined', () => {
            let testItem = new ValidatorConfigMergeService();
            expect(testItem.identifyValidatorConflict({
                errorCode: '1',
                conditionConfig: null,
            },
                [{
                    errorCode: '2',
                    conditionConfig: null,
                },
                {
                    errorCode: '3',
                    conditionConfig: null,
                }],
                { valueHostName: 'Field1' })).toBeUndefined();
        });
        test('source.errorCode found in populated destination array returns the instance from the destination', () => {
            let testItem = new ValidatorConfigMergeService();
            let dest1: ValidatorConfig = {
                errorCode: '1', // will match
                conditionConfig: null
            };
            let dest2: ValidatorConfig = {
                errorCode: '2', // will not match
                conditionConfig: null
            };
            expect(testItem.identifyValidatorConflict({
                errorCode: '1',
                conditionConfig: null,
            },
                [dest1, dest2],
                { valueHostName: 'Field1' })).toBe(dest1);
            expect(testItem.identifyValidatorConflict({
                errorCode: '2',
                conditionConfig: null,
            },
                [dest1, dest2],
                { valueHostName: 'Field1' })).toBe(dest2);
        });
        test('with no errorcode, but conditionTypes instead, source found in populated destination array returns the instance from the destination', () => {
            let testItem = new ValidatorConfigMergeService();
            let dest1: ValidatorConfig = {
                conditionConfig: {
                    conditionType: '1'  // will match
                }
            };
            let dest2: ValidatorConfig = {
                conditionConfig: {
                    conditionType: '2' // will not match
                }
            };
            expect(testItem.identifyValidatorConflict({
                conditionConfig: {
                    conditionType: '1'
                },
            },
                [dest1, dest2],
                { valueHostName: 'Field1' })).toBe(dest1);
            expect(testItem.identifyValidatorConflict({
                errorCode: '2', // mixing it up with error code, instead of conditionType
                conditionConfig: null,
            },
                [dest1, dest2],
                { valueHostName: 'Field1' })).toBe(dest2);
        });
    });
    describe('merge', () => {
        function testResolve(testItem: ValidatorConfigMergeService,
            source: ValidatorsValueHostBaseConfig, destination: ValidatorsValueHostBaseConfig,
            expectedDestination: ValidatorsValueHostBaseConfig,
            logContains?: string, logLevel?: LoggingLevel) {
            let setup = createServices();
            testItem.services = setup.services;
            setup.services.validatorConfigMergeService = testItem;
            setup.logger.minLevel = LoggingLevel.Debug;

            testItem.merge(source, destination);
            expect(destination).toEqual(expectedDestination);
            if (logContains)
                expect(setup.logger.findMessage(logContains, logLevel ?? null, null)).toBeTruthy();
        }
        test('Neither source or destination has ValidatorConfigs leaves destination unchanged', () => {
            let testItem = new ValidatorConfigMergeService();
            testResolve(testItem, {
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs: undefined!
            },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: undefined!
                },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: undefined!
                });
        });
        test('Source and destination has ValidatorConfigs=null leaves destination unchanged', () => {
            let testItem = new ValidatorConfigMergeService();
            testResolve(testItem, {
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs: null
            },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: null
                },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: null
                });
        });
        test('Source and destination has ValidatorConfigs=[] leaves destination unchanged', () => {
            let testItem = new ValidatorConfigMergeService();
            testResolve(testItem, {
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs: []
            },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: []
                },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: []
                });
        });
        test('Source has 2 and destination has ValidatorConfigs=null creates validatorConfigs with the 1 item in destination', () => {
            let testItem = new ValidatorConfigMergeService();
            testResolve(testItem, {
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs:
                    [{
                        conditionConfig: {
                            conditionType: '1'
                        }
                    },
                    {
                        errorCode: '2',
                        errorMessage: 'Message',
                        conditionConfig: { conditionType: 'Require' }
                    }]
            },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: null
                },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: [{
                        conditionConfig: {
                            conditionType: '1'
                        }
                    },
                    {
                        errorCode: '2',
                        errorMessage: 'Message',
                        conditionConfig: { conditionType: 'Require' }
                    }]
                });
        });
        test('Source and destination non-conflicting Validators adds the source into destination', () => {
            let testItem = new ValidatorConfigMergeService();
            testResolve(testItem, {
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs:
                    [{
                        conditionConfig: {
                            conditionType: '1'
                        }
                    }]
            },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: [
                        {
                            errorCode: '2',
                            errorMessage: 'Message',
                            conditionConfig: { conditionType: 'Require' }
                        }]
                },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: [
                        {
                            errorCode: '2',
                            errorMessage: 'Message',
                            conditionConfig: { conditionType: 'Require' }
                        },
                        {
                            conditionConfig: {
                                conditionType: '1'
                            }
                        }]
                });
        });
        test('Source and destination conflicting Validators merges validatorConfigs except nochange for conditionConfig', () => {
            //!! NOTE: There is an override for conditionConfig. It involves passing a special flag
            // through the ValidatorConfig. The ValidatorConfigMergeService respects that flag and replaces.
            // That capability is tested in the Builder and Modifier code tests.
            let testItem = new ValidatorConfigMergeService();
            testResolve(testItem, {
                valueHostType: ValueHostType.Input,
                name: 'Field1',
                validatorConfigs:
                    [{
                        conditionConfig: {
                            conditionType: '1'
                        },
                        summaryMessage: 'From Source'
                    }]
            },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: [
                        {
                            errorCode: '1',
                            errorMessage: 'From Destination',
                            conditionConfig: { conditionType: 'Require' }
                        }]
                },
                {
                    valueHostType: ValueHostType.Input,
                    name: 'Field1',
                    dataType: LookupKey.String,
                    validatorConfigs: [
                        {
                            errorCode: '1',
                            errorMessage: 'From Destination',
                            summaryMessage: 'From Source',
                            conditionConfig: { conditionType: 'Require' }
                        }
                    ]
                },
                'ConditionType mismatch for', LoggingLevel.Warn);
        });
    });

});