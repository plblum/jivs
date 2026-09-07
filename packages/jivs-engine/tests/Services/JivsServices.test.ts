import { JivsServices } from "../../src/Services/JivsServices";
import { ValidatorFactory } from "../../src/Validation/Validator";

import { DataTypeCheckGeneratorService } from "../../src/Services/DataTypeCheckGeneratorService";
import { DataTypeFormatterService } from "../../src/Services/DataTypeFormatterService";
import { MessageTokenResolverService } from "../../src/Services/MessageTokenResolverService";
import { DataTypeParserService } from "../../src/Services/DataTypeParserService";
import { ValidatorConfigMergeService } from "../../src/Services/ConfigMergeService";

import { CachingService } from "../../src/Services/CachingService";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { assertValidFallbacks } from "../../src/Interfaces/Services";

import { ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { ConsoleLoggingService } from "../../src/Services/ConsoleLoggingService";
import { ErrorMessagesService } from "../../src/Services/ErrorMessagesService";
import { DataTypeComparerService } from "../../src/Services/DataTypeComparerService";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { IServiceWithFallback, IServicesAccessor, toIServiceWithFallback, toIServicesAccessor } from "../../src/Interfaces/Services";
import { TestingLoggingService } from "../../src/Support/TestingLoggingService";
import { CultureService } from "../../src/Services/CultureService";
import { LookupKeyFallbackService } from "../../src/Services/LookupKeyFallbackService";
import { ValueHostConfigMergeService } from "../../src/Services/ConfigMergeService";
import { MockJivsServices } from "../TestSupport/mocks";
import { ValueAdapterService } from '../../src/Services/ValueAdapterService';
import { ObjectFinderService } from '../../src/Services/ObjectFinderService';


describe('constructor and initial properties, many taken from ValGlobals', () => {
    test('Has parameters', () => {
// NOTE: Ignores services that were covered by JivsServices
        let testItem = new JivsServices();
      
        let x: any;
        expect(() => x = testItem.conditionFactory).toThrow(/ConditionFactory/);
        expect(() => x = testItem.dataTypeComparerService).toThrow(/dataTypeComparerService/);
        expect(() => x = testItem.dataTypeConverterService).toThrow(/dataTypeConverterService/);
        expect(() => x = testItem.dataTypeIdentifierService).toThrow(/dataTypeIdentifierService/);
       
        expect(testItem.loggingService).toBeInstanceOf(ConsoleLoggingService);
        expect(testItem.valueHostFactory).toBeInstanceOf(ValueHostFactory);

        expect(testItem.errorMessagesService).toBeInstanceOf(ErrorMessagesService);
        expect(testItem.cultureService).toBeInstanceOf(CultureService);    
        expect(testItem.lookupKeyFallbackService).toBeInstanceOf(LookupKeyFallbackService);            
        expect(testItem.valueHostConfigMergeService).toBeInstanceOf(ValueHostConfigMergeService);        
        expect(() => x = testItem.dataTypeFormatterService).toThrow(/dataTypeFormatterService/);
        expect(() => x = testItem.dataTypeParserService).toThrow(/dataTypeParserService/);
        expect(() => x = testItem.dataTypeCheckGeneratorService).toThrow(/dataTypeCheckGeneratorService/);
        expect(() => x = testItem.messageTokenResolverService).toThrow(/MessageTokenResolverService/);       
        expect(testItem.validatorFactory).toBeInstanceOf(ValidatorFactory);
        expect(testItem.validatorConfigMergeService).toBeInstanceOf(ValidatorConfigMergeService);
        expect(testItem.cachingService).toBeInstanceOf(CachingService);
        expect(testItem.valueAdapterService).toBeInstanceOf(ValueAdapterService);
        expect(testItem.objectFinderService).toBeInstanceOf(ObjectFinderService);

    });
});
describe('Replace factories and services', () => {
    test('Replace conditionFactory', () => {
        let replacement = new ConditionFactory();

        let testItem = new JivsServices();
        testItem.conditionFactory = replacement;
        expect(testItem.conditionFactory).toBe(replacement);
    });
    test('Replace dataTypeComparerService', () => {
        let replacement = new DataTypeComparerService();
        let testItem = new JivsServices();
        testItem.dataTypeComparerService = replacement;
        expect(testItem.dataTypeComparerService).toBe(replacement);
    });
    test('Replace dataTypeConverterService', () => {
        let replacement = new DataTypeConverterService();
        let testItem = new JivsServices();
        testItem.dataTypeConverterService = replacement;
        expect(testItem.dataTypeConverterService).toBe(replacement);
    });
    test('Replace dataTypeIdentifierService', () => {
        let replacement = new DataTypeIdentifierService();
        let testItem = new JivsServices();
        testItem.dataTypeIdentifierService = replacement;
        expect(testItem.dataTypeIdentifierService).toBe(replacement);
    });
    test('Replace cultureService', () => {
        let replacement = new CultureService('fr');

        let testItem = new JivsServices();
        testItem.cultureService = replacement;
        expect(testItem.cultureService).toBe(replacement);
    });    
    test('Replace lookupKeyFallbackService', () => {
        let replacement = new LookupKeyFallbackService();

        let testItem = new JivsServices();
        testItem.lookupKeyFallbackService = replacement;
        expect(testItem.lookupKeyFallbackService).toBe(replacement);
    });        
    test('Replace errorMessagesService', () => {
        let replacement = new ErrorMessagesService();

        let testItem = new JivsServices();
        testItem.errorMessagesService = replacement;
        expect(testItem.errorMessagesService).toBe(replacement);
    });    
    test('Replace valueHostConfigMergeService', () => {
        let replacement = new ValueHostConfigMergeService();

        let testItem = new JivsServices();
        testItem.valueHostConfigMergeService = replacement;
        expect(testItem.valueHostConfigMergeService).toBe(replacement);
    });

    test('Replace loggingService', () => {
        let replacement = new TestingLoggingService();
        let testItem = new JivsServices();
        testItem.loggingService = replacement;
        expect(testItem.loggingService).toBe(replacement);
    });    
    test('Replace valueHostFactory', () => {
        let replacement = new ValueHostFactory();
        let testItem = new JivsServices();
        testItem.valueHostFactory = replacement;
        expect(testItem.valueHostFactory).toBe(replacement);
    });    
   
    test('Replace dataTypeFormatterService', () => {
        let replacement = new DataTypeFormatterService();
        let testItem = new JivsServices();
        testItem.dataTypeFormatterService = replacement;
        expect(testItem.dataTypeFormatterService).toBe(replacement);
    });
    test('Replace dataTypeParserService', () => {
        let replacement = new DataTypeParserService();
        let testItem = new JivsServices();
        testItem.dataTypeParserService = replacement;
        expect(testItem.dataTypeParserService).toBe(replacement);
    });    
    test('Replace dataTypeCheckGeneratorService', () => {
        let replacement = new DataTypeCheckGeneratorService();
        let testItem = new JivsServices();
        testItem.dataTypeCheckGeneratorService = replacement;
        expect(testItem.dataTypeCheckGeneratorService).toBe(replacement);
    });    
    test('Replace messageTokenResolverService', () => {
        let replacement = new MessageTokenResolverService();

        let testItem = new JivsServices();
        testItem.messageTokenResolverService = replacement;
        expect(testItem.messageTokenResolverService).toBe(replacement);
    });
    test('Replace validatorConfigMergeService', () => {
        let replacement = new ValidatorConfigMergeService();

        let testItem = new JivsServices();
        testItem.validatorConfigMergeService = replacement;
        expect(testItem.validatorConfigMergeService).toBe(replacement);
    });    
    test('Replace validatorFactory', () => {
        let replacement = new ValidatorFactory();
        let testItem = new JivsServices();
        testItem.validatorFactory = replacement;
        expect(testItem.validatorFactory).toBe(replacement);
    });    
    test('Replace CachingService', () => {
        let replacement = new CachingService();
        let testItem = new JivsServices();
        testItem.cachingService = replacement;
        expect(testItem.cachingService).toBe(replacement);
    });
    test('Replace valueAdapterService', () =>
    {
        let replacement = new ValueAdapterService();
        let testItem = new JivsServices();
        testItem.valueAdapterService = replacement;
        expect(testItem.valueAdapterService).toBe(replacement);
    });
    test('Replace objectFinderService', () => {
        let replacement = new ObjectFinderService();
        let testItem = new JivsServices();
        testItem.objectFinderService = replacement;
        expect(testItem.objectFinderService).toBe(replacement);
    });
});

describe('validatorFactory property', () => {
    test('Set and Get', () => {
        let testItem = new JivsServices();
        let factory = new ValidatorFactory();
        testItem.validatorFactory = factory;
        expect(testItem.validatorFactory).toBe(factory);
        expect(() => testItem.validatorFactory = null!).toThrow();
    });
    test('Get without Set throws', () => {
        let testItem = new JivsServices();
        let x: any;
        expect(() => x = testItem.validatorFactory).not.toThrow();
        expect(x).toBeInstanceOf(ValidatorFactory);
    });
  
});

describe('valueHostFactory property', () => {
    test('Set and Get', () => {
        let testItem = new JivsServices();
        let factory = new ValueHostFactory();
        testItem.valueHostFactory = factory;
        expect(testItem.valueHostFactory).toBe(factory);
        expect(() => testItem.valueHostFactory = null!).toThrow();
    });
    test('Get without Set returns a default ValueHostFactory', () => {
        let testItem = new JivsServices();
        let x: any;
        expect(() => x = testItem.valueHostFactory).not.toThrow();
        expect(x).toBeInstanceOf(ValueHostFactory);
    });
  
});

describe('toIServicesAccessor', () => {
    test('Valid object returns it', () => {
        let test: IServicesAccessor = {
            services: new MockJivsServices(false, false),
            dispose: () => { },
        };
        expect(toIServicesAccessor(test)).toBe(test);
    });
    test('Invalid object returns null', () => {
        expect(toIServicesAccessor({})).toBeNull();
        expect(toIServicesAccessor({ SERVICES: new MockJivsServices(false, false) })).toBeNull();        
    });    
});

describe('toIServiceWithFallback', () => {
    test('Valid object with fallbackService=null returns it', () => {
        let test: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        };
        expect(toIServiceWithFallback(test)).toBe(test);
    });
    test('Valid object with fallbackService=service returns it', () => {
        let test: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: {
                fallbackService: null
            },
            dispose: () => { },
        };
        expect(toIServiceWithFallback(test)).toBe(test);
    });    
    test('Invalid object returns null', () => {
        expect(toIServiceWithFallback({})).toBeNull();
        expect(toIServiceWithFallback({ FALLBACKSERVICE: null })).toBeNull();        
    });    
});

describe('assertValidFallbacks', () => {
    test('Pass null does not throw', () => {
        let hostService: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        };
        expect(()=> assertValidFallbacks(null, hostService)).not.toThrow();
    });
    test('Pass service with its fallbackService=null does not throw', () => {
        let hostService: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        };
        let fallbackService: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        };        
        expect(()=> assertValidFallbacks(fallbackService, hostService)).not.toThrow();
    });    
    test('hostService already has 9 ancestors, but does not throw', () => {
        let hostService: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        }
        let fallbackService: IServiceWithFallback<any> = {
            serviceName: '',
            dispose: () => { },
            fallbackService: {
                fallbackService: {
                    fallbackService: {
                        fallbackService: { 
                            fallbackService: {
                                fallbackService: {
                                    fallbackService: {
                                        fallbackService: {
                                            fallbackService: {}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };        
        expect(()=> assertValidFallbacks(fallbackService, hostService)).not.toThrow();
    });        
    test('hostService already has 10 ancestors, throws', () => {
        let hostService: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        };
        let fallbackService: IServiceWithFallback<any> = {
            serviceName: '',
            dispose: () => { },
            fallbackService: {
                fallbackService: {
                    fallbackService: {
                        fallbackService: { 
                            fallbackService: {
                                fallbackService: {
                                    fallbackService: {
                                        fallbackService: {
                                            fallbackService: {
                                                fallbackService: {
                                                    
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };        
        expect(()=> assertValidFallbacks(fallbackService, hostService)).toThrow(/limit/);
    });            
    test('fallback already points to hostService, causing a loop, throws', () => {
        let hostService: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        };
        let fallbackService: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        };        
        fallbackService.fallbackService = hostService;
        expect(()=> assertValidFallbacks(fallbackService, hostService)).toThrow(/loops/);
    });                
    test('fallback already points to hostService through its child, causing a loop, throws', () => {
        let hostService: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        };
        let fallbackService1: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        };      
        let fallbackService2: IServiceWithFallback<any> = {
            serviceName: '',
            fallbackService: null,
            dispose: () => { },
        };                
        fallbackService1.fallbackService = fallbackService2;
        fallbackService2.fallbackService = hostService;
        expect(()=> assertValidFallbacks(fallbackService1, hostService)).toThrow(/loops/);
    });                    
});

describe('dispose', () => {
    
    test('accessing any service after dispose throws a TypeError', () => {
        let testItem = new JivsServices();
        testItem.conditionFactory = new ConditionFactory();
        testItem.cultureService = new CultureService('en');
        testItem.dataTypeComparerService = new DataTypeComparerService();
        testItem.dataTypeConverterService = new DataTypeConverterService();
        testItem.dataTypeIdentifierService = new DataTypeIdentifierService();
        testItem.loggingService = new ConsoleLoggingService();
        testItem.lookupKeyFallbackService = new LookupKeyFallbackService();
        testItem.valueHostConfigMergeService = new ValueHostConfigMergeService();
        testItem.errorMessagesService = new ErrorMessagesService();
        testItem.valueHostFactory = new ValueHostFactory();        
        testItem.dataTypeCheckGeneratorService = new DataTypeCheckGeneratorService();
        testItem.dataTypeFormatterService = new DataTypeFormatterService();
        testItem.dataTypeParserService = new DataTypeParserService();
        testItem.messageTokenResolverService = new MessageTokenResolverService();
        testItem.validatorConfigMergeService = new ValidatorConfigMergeService();
        testItem.validatorFactory = new ValidatorFactory();
        testItem.cachingService = new CachingService();

        testItem.dispose();
        expect(() => testItem.dataTypeCheckGeneratorService).toThrow(TypeError);
        expect(() => testItem.dataTypeFormatterService).toThrow(TypeError);
        expect(() => testItem.dataTypeParserService).toThrow(TypeError);
        expect(() => testItem.messageTokenResolverService).toThrow(TypeError);
        expect(() => testItem.validatorConfigMergeService).toThrow(TypeError);
        expect(() => testItem.validatorFactory).toThrow(TypeError);
        expect(() => testItem.conditionFactory).toThrow(TypeError);        
        expect(() => testItem.cultureService).toThrow(TypeError);        
        expect(() => testItem.dataTypeComparerService).toThrow(TypeError);
        expect(() => testItem.errorMessagesService).toThrow(TypeError);
        expect(() => testItem.valueHostConfigMergeService).toThrow(TypeError);     
        expect(() => testItem.dataTypeConverterService).toThrow(TypeError);
        expect(() => testItem.dataTypeIdentifierService).toThrow(TypeError);
        expect(() => testItem.loggingService).toThrow(TypeError);
        expect(() => testItem.lookupKeyFallbackService).toThrow(TypeError);
        expect(() => testItem.valueHostFactory).toThrow(TypeError);
        expect(() => testItem.cachingService).toThrow(TypeError);

    });
});