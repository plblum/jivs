import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ValueHostsServices } from "../../src/Services/ValueHostsServices";
import { assertValidFallbacks } from "../../src/Interfaces/Services";

import { ValueHostFactory } from "../../src/ValueHosts/ValueHostFactory";
import { ConsoleLoggerService } from "../../src/Services/ConsoleLoggerService";
import { TextLocalizerService } from "../../src/Services/TextLocalizerService";
import { DataTypeComparerService } from "../../src/Services/DataTypeComparerService";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { IServiceWithFallback, IServicesAccessor, toIServiceWithFallback, toIServicesAccessor } from "../../src/Interfaces/Services";
import { CapturingLogger } from "../TestSupport/CapturingLogger";
import { CultureService } from "../../src/Services/CultureService";
import { LookupKeyFallbackService } from "../../src/Services/LookupKeyFallbackService";
import { ValueHostConfigMergeService } from "../../src/Services/ConfigMergeService";
import { ValueHostsManagerConfigBuilderFactory } from "../../src/Services/ManagerConfigBuilderFactory";
import { ValidationManagerConfigModifierFactory, ValueHostsManagerConfigModifierFactory } from "../../src/Services/ManagerConfigModifierFactory";
import { ValueHostsManagerConfigAnalysisService } from "../../src/Services/ConfigAnalysisService/ConfigAnalysisService";
import { MockValidationServices } from "../TestSupport/mocks";

describe('constructor and initial properties, many taken from ValGlobals', () => {
    test('Has parameters', () => {

        let testItem = new ValueHostsServices();
      
        let x: any;
        expect(() => x = testItem.conditionFactory).toThrow(/ConditionFactory/);
        expect(() => x = testItem.dataTypeComparerService).toThrow(/dataTypeComparerService/);
        expect(() => x = testItem.dataTypeConverterService).toThrow(/dataTypeConverterService/);
        expect(() => x = testItem.dataTypeIdentifierService).toThrow(/dataTypeIdentifierService/);
       
        expect(testItem.loggerService).toBeInstanceOf(ConsoleLoggerService);
        expect(testItem.valueHostFactory).toBeInstanceOf(ValueHostFactory);

        expect(testItem.textLocalizerService).toBeInstanceOf(TextLocalizerService);
        expect(testItem.cultureService).toBeInstanceOf(CultureService);    
        expect(testItem.lookupKeyFallbackService).toBeInstanceOf(LookupKeyFallbackService);            
        expect(testItem.valueHostConfigMergeService).toBeInstanceOf(ValueHostConfigMergeService);
        expect(testItem.managerConfigBuilderFactory).toBeInstanceOf(ValueHostsManagerConfigBuilderFactory);
        expect(testItem.managerConfigModifierFactory).toBeInstanceOf(ValueHostsManagerConfigModifierFactory);  
        expect(testItem.configAnalysisService).toBeInstanceOf(ValueHostsManagerConfigAnalysisService);
    });
});
describe('Replace factories and services', () => {
    test('Replace conditionFactory', () => {
        let replacement = new ConditionFactory();

        let testItem = new ValueHostsServices();
        testItem.conditionFactory = replacement;
        expect(testItem.conditionFactory).toBe(replacement);
    });
    test('Replace dataTypeComparerService', () => {
        let replacement = new DataTypeComparerService();
        let testItem = new ValueHostsServices();
        testItem.dataTypeComparerService = replacement;
        expect(testItem.dataTypeComparerService).toBe(replacement);
    });
    test('Replace dataTypeConverterService', () => {
        let replacement = new DataTypeConverterService();
        let testItem = new ValueHostsServices();
        testItem.dataTypeConverterService = replacement;
        expect(testItem.dataTypeConverterService).toBe(replacement);
    });
    test('Replace dataTypeIdentifierService', () => {
        let replacement = new DataTypeIdentifierService();
        let testItem = new ValueHostsServices();
        testItem.dataTypeIdentifierService = replacement;
        expect(testItem.dataTypeIdentifierService).toBe(replacement);
    });
    test('Replace cultureService', () => {
        let replacement = new CultureService();

        let testItem = new ValueHostsServices();
        testItem.cultureService = replacement;
        expect(testItem.cultureService).toBe(replacement);
    });    
    test('Replace lookupKeyFallbackService', () => {
        let replacement = new LookupKeyFallbackService();

        let testItem = new ValueHostsServices();
        testItem.lookupKeyFallbackService = replacement;
        expect(testItem.lookupKeyFallbackService).toBe(replacement);
    });        
    test('Replace textLocalizerService', () => {
        let replacement = new TextLocalizerService();

        let testItem = new ValueHostsServices();
        testItem.textLocalizerService = replacement;
        expect(testItem.textLocalizerService).toBe(replacement);
    });    
    test('Replace valueHostConfigMergeService', () => {
        let replacement = new ValueHostConfigMergeService();

        let testItem = new ValueHostsServices();
        testItem.valueHostConfigMergeService = replacement;
        expect(testItem.valueHostConfigMergeService).toBe(replacement);
    });

    test('Replace loggerService', () => {
        let replacement = new CapturingLogger();
        let testItem = new ValueHostsServices();
        testItem.loggerService = replacement;
        expect(testItem.loggerService).toBe(replacement);
    });    
    test('Replace valueHostFactory', () => {
        let replacement = new ValueHostFactory();
        let testItem = new ValueHostsServices();
        testItem.valueHostFactory = replacement;
        expect(testItem.valueHostFactory).toBe(replacement);
    });    

    test('Replace managerConfigBuilderFactory', () => {
        let replacement = new ValueHostsManagerConfigBuilderFactory();
        let testItem = new ValueHostsServices();
        testItem.managerConfigBuilderFactory = replacement;
        expect(testItem.managerConfigBuilderFactory).toBe(replacement);
        expect(replacement.services).toBe(testItem);
    });    
    test('Replace managerConfigModifierFactory', () => {
        let replacement = new ValueHostsManagerConfigModifierFactory();
        let testItem = new ValueHostsServices();
        testItem.managerConfigModifierFactory = replacement;
        expect(testItem.managerConfigModifierFactory).toBe(replacement);
        expect(replacement.services).toBe(testItem);
    });        
    test('Replace configAnalysisService', () => {
        let replacement = new ValueHostsManagerConfigAnalysisService();
        let testItem = new ValueHostsServices();
        testItem.configAnalysisService = replacement;
        expect(testItem.configAnalysisService).toBe(replacement);
    });        
});
describe('valueHostFactory property', () => {
    test('Set and Get', () => {
        let testItem = new ValueHostsServices();
        let factory = new ValueHostFactory();
        testItem.valueHostFactory = factory;
        expect(testItem.valueHostFactory).toBe(factory);
        expect(() => testItem.valueHostFactory = null!).toThrow();
    });
    test('Get without Set returns a default ValueHostFactory', () => {
        let testItem = new ValueHostsServices();
        let x: any;
        expect(() => x = testItem.valueHostFactory).not.toThrow();
        expect(x).toBeInstanceOf(ValueHostFactory);
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
        let testItem = new ValueHostsServices();
        testItem.conditionFactory = new ConditionFactory();
        testItem.cultureService = new CultureService();
        testItem.dataTypeComparerService = new DataTypeComparerService();
        testItem.dataTypeConverterService = new DataTypeConverterService();
        testItem.dataTypeIdentifierService = new DataTypeIdentifierService();
        testItem.loggerService = new ConsoleLoggerService();
        testItem.lookupKeyFallbackService = new LookupKeyFallbackService();
        testItem.valueHostConfigMergeService = new ValueHostConfigMergeService();
        testItem.textLocalizerService = new TextLocalizerService();
        testItem.valueHostFactory = new ValueHostFactory();
        testItem.configAnalysisService = new ValueHostsManagerConfigAnalysisService();
        testItem.managerConfigBuilderFactory = new ValueHostsManagerConfigBuilderFactory();
        testItem.managerConfigModifierFactory = new ValueHostsManagerConfigModifierFactory();
        testItem.dispose();

        expect(() => testItem.conditionFactory).toThrow(TypeError);        
        expect(() => testItem.cultureService).toThrow(TypeError);        
        expect(() => testItem.dataTypeComparerService).toThrow(TypeError);
        expect(() => testItem.textLocalizerService).toThrow(TypeError);
        expect(() => testItem.valueHostConfigMergeService).toThrow(TypeError);
        expect(() => testItem.configAnalysisService).toThrow(TypeError);
        expect(() => testItem.managerConfigBuilderFactory).toThrow(TypeError);
        expect(() => testItem.managerConfigModifierFactory).toThrow(TypeError);

    });
});