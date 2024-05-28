import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { assertValidFallbacks } from "../../src/Interfaces/Services";
import { MockValidationServices } from "../TestSupport/mocks";
import { ValidatorFactory } from "../../src/Validation/Validator";
import { ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { ConsoleLoggerService } from "../../src/Services/ConsoleLoggerService";
import { TextLocalizerService } from "../../src/Services/TextLocalizerService";
import { AutoGenerateDataTypeCheckService } from "../../src/Services/AutoGenerateDataTypeCheckService";
import { DataTypeComparerService } from "../../src/Services/DataTypeComparerService";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { DataTypeFormatterService } from "../../src/Services/DataTypeFormatterService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { MessageTokenResolverService } from "../../src/Services/MessageTokenResolverService";
import { IServiceWithFallback, IServicesAccessor, toIServiceWithFallback, toIServicesAccessor } from "../../src/Interfaces/Services";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { CultureService } from "../../src/Services/CultureService";
import { LookupKeyFallbackService } from "../../src/Services/LookupKeyFallbackService";

describe('constructor and initial properties, many taken from ValGlobals', () => {
    test('Has parameters', () => {

        let testItem = new ValidationServices();
      
        let x: any;
        expect(() => x = testItem.conditionFactory).toThrow(/ConditionFactory/);
        expect(() => x = testItem.dataTypeFormatterService).toThrow(/dataTypeFormatterService/);
        expect(() => x = testItem.dataTypeComparerService).toThrow(/dataTypeComparerService/);
        expect(() => x = testItem.dataTypeConverterService).toThrow(/dataTypeConverterService/);
        expect(() => x = testItem.dataTypeIdentifierService).toThrow(/dataTypeIdentifierService/);
        expect(() => x = testItem.autoGenerateDataTypeCheckService).toThrow(/autoGenerateDataTypeCheckService/);
        expect(() => x = testItem.messageTokenResolverService).toThrow(/MessageTokenResolverService/);
        expect(testItem.loggerService).toBeInstanceOf(ConsoleLoggerService);
        expect(testItem.valueHostFactory).toBeInstanceOf(ValueHostFactory);
        expect(testItem.validatorFactory).toBeInstanceOf(ValidatorFactory);
        expect(testItem.textLocalizerService).toBeInstanceOf(TextLocalizerService);
        expect(testItem.cultureService).toBeInstanceOf(CultureService);    
        expect(testItem.lookupKeyFallbackService).toBeInstanceOf(LookupKeyFallbackService);            
    });
});
describe('Replace factories and services', () => {
    test('Replace conditionFactory', () => {
        let replacement = new ConditionFactory();

        let testItem = new ValidationServices();
        testItem.conditionFactory = replacement;
        expect(testItem.conditionFactory).toBe(replacement);
    });
    test('Replace dataTypeFormatterService', () => {
        let replacement = new DataTypeFormatterService();
        let testItem = new ValidationServices();
        testItem.dataTypeFormatterService = replacement;
        expect(testItem.dataTypeFormatterService).toBe(replacement);
    });
    test('Replace dataTypeComparerService', () => {
        let replacement = new DataTypeComparerService();
        let testItem = new ValidationServices();
        testItem.dataTypeComparerService = replacement;
        expect(testItem.dataTypeComparerService).toBe(replacement);
    });
    test('Replace dataTypeConverterService', () => {
        let replacement = new DataTypeConverterService();
        let testItem = new ValidationServices();
        testItem.dataTypeConverterService = replacement;
        expect(testItem.dataTypeConverterService).toBe(replacement);
    });
    test('Replace dataTypeIdentifierService', () => {
        let replacement = new DataTypeIdentifierService();
        let testItem = new ValidationServices();
        testItem.dataTypeIdentifierService = replacement;
        expect(testItem.dataTypeIdentifierService).toBe(replacement);
    });
    test('Replace autoGenerateDataTypeCheckService', () => {
        let replacement = new AutoGenerateDataTypeCheckService();
        let testItem = new ValidationServices();
        testItem.autoGenerateDataTypeCheckService = replacement;
        expect(testItem.autoGenerateDataTypeCheckService).toBe(replacement);
    });    
    test('Replace cultureService', () => {
        let replacement = new CultureService();

        let testItem = new ValidationServices();
        testItem.cultureService = replacement;
        expect(testItem.cultureService).toBe(replacement);
    });    
    test('Replace lookupKeyFallbackService', () => {
        let replacement = new LookupKeyFallbackService();

        let testItem = new ValidationServices();
        testItem.lookupKeyFallbackService = replacement;
        expect(testItem.lookupKeyFallbackService).toBe(replacement);
    });        
    test('Replace textLocalizerService', () => {
        let replacement = new TextLocalizerService();

        let testItem = new ValidationServices();
        testItem.textLocalizerService = replacement;
        expect(testItem.textLocalizerService).toBe(replacement);
    });    
    test('Replace messageTokenResolverService', () => {
        let replacement = new MessageTokenResolverService();

        let testItem = new ValidationServices();
        testItem.messageTokenResolverService = replacement;
        expect(testItem.messageTokenResolverService).toBe(replacement);
    });
    test('Replace loggerService', () => {
        let replacement = new CapturingLogger();
        let testItem = new ValidationServices();
        testItem.loggerService = replacement;
        expect(testItem.loggerService).toBe(replacement);
    });    
    test('Replace valueHostFactory', () => {
        let replacement = new ValueHostFactory();
        let testItem = new ValidationServices();
        testItem.valueHostFactory = replacement;
        expect(testItem.valueHostFactory).toBe(replacement);
    });    
    test('Replace validatorFactory', () => {
        let replacement = new ValidatorFactory();
        let testItem = new ValidationServices();
        testItem.validatorFactory = replacement;
        expect(testItem.validatorFactory).toBe(replacement);
    });    

});
describe('valueHostFactory property', () => {
    test('Set and Get', () => {
        let testItem = new ValidationServices();
        let factory = new ValueHostFactory();
        testItem.valueHostFactory = factory;
        expect(testItem.valueHostFactory).toBe(factory);
        expect(() => testItem.valueHostFactory = null!).toThrow();
    });
    test('Get without Set returns a default ValueHostFactory', () => {
        let testItem = new ValidationServices();
        let x: any;
        expect(() => x = testItem.valueHostFactory).not.toThrow();
        expect(x).toBeInstanceOf(ValueHostFactory);
    });
  
});
describe('validatorFactory property', () => {
    test('Set and Get', () => {
        let testItem = new ValidationServices();
        let factory = new ValidatorFactory();
        testItem.validatorFactory = factory;
        expect(testItem.validatorFactory).toBe(factory);
        expect(() => testItem.validatorFactory = null!).toThrow();
    });
    test('Get without Set throws', () => {
        let testItem = new ValidationServices();
        let x: any;
        expect(() => x = testItem.validatorFactory).not.toThrow();
        expect(x).toBeInstanceOf(ValidatorFactory);
    });
  
});

describe('toIServicesAccessor', () => {
    test('Valid object returns it', () => {
        let test: IServicesAccessor = {
            services: new MockValidationServices(false, false),
            dispose: () => { },
        };
        expect(toIServicesAccessor(test)).toBe(test);
    });
    test('Invalid object returns null', () => {
        expect(toIServicesAccessor({})).toBeNull();
        expect(toIServicesAccessor({ SERVICES: new MockValidationServices(false, false) })).toBeNull();        
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
        let testItem = new ValidationServices();
        testItem.autoGenerateDataTypeCheckService = new AutoGenerateDataTypeCheckService();
        testItem.conditionFactory = new ConditionFactory();
        testItem.cultureService = new CultureService();
        testItem.dataTypeComparerService = new DataTypeComparerService();
        testItem.dataTypeConverterService = new DataTypeConverterService();
        testItem.dataTypeFormatterService = new DataTypeFormatterService();
        testItem.dataTypeIdentifierService = new DataTypeIdentifierService();
        testItem.loggerService = new ConsoleLoggerService();
        testItem.lookupKeyFallbackService = new LookupKeyFallbackService();
        testItem.messageTokenResolverService = new MessageTokenResolverService();
        testItem.textLocalizerService = new TextLocalizerService();
        testItem.validatorFactory = new ValidatorFactory();
        testItem.valueHostFactory = new ValueHostFactory();
        testItem.dispose();
        expect(() => testItem.autoGenerateDataTypeCheckService).toThrow(TypeError);
        expect(() => testItem.conditionFactory).toThrow(TypeError);        
        expect(() => testItem.cultureService).toThrow(TypeError);        
        expect(() => testItem.dataTypeComparerService).toThrow(TypeError);
        expect(() => testItem.textLocalizerService).toThrow(TypeError);
    });
});