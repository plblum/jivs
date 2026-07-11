

// function createVMConfig(): ValidationManagerConfig
// {
//     let vmConfig: ValidationManagerConfig = {
//         services: new MockValidationServices(false, true),
//         valueHostConfigs: []
//     };
//     return vmConfig;
// }

// function createFluent(): ValidationManagerStartFluent {
//     return new ValidationManagerStartFluent(null, new MockValidationServices(true, true));
// }


// describe('FluentConditionBuilder', () => {
//     test('constructor with vhConfig sets up vhConfig property', () => {
//         let vhConfig: EvaluateChildConditionResultsBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         }
//         let testItem = new FluentConditionBuilder(vhConfig);
//         expect(testItem.parentConfig).toBe(vhConfig);
//     });
//     test('constructor with null parameter creates a Config with conditionConfigs=[] and type="TBD"', () => {
//         let testItem = new FluentConditionBuilder(null);
//         expect(testItem.parentConfig).toEqual({
//             conditionType: 'TBD',
//             conditionConfigs: []
//         });
//     });    

//     test('constructor with vhConfig that has conditionConfigs=null sets up vhConfig property with empty conditionConfigs array', () => {
//         let vhConfig: EvaluateChildConditionResultsBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: null as unknown as Array<ConditionConfig>
//         }

//         let testItem = new FluentConditionBuilder(vhConfig);
//         expect(testItem.parentConfig).toBeDefined();
//         expect(testItem.parentConfig.conditionConfigs).toEqual([]);
//     });
//     test('add() with all parameters correctly defined', () => {
//         let vhConfig: EvaluateChildConditionResultsBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         }
//         let testItem = new FluentConditionBuilder(vhConfig);

//         expect(() => testItem.add(ConditionType.RequireText, {})).not.toThrow();
//         expect(testItem.parentConfig.conditionConfigs!.length).toBe(1);
//         expect(testItem.parentConfig.conditionConfigs![0]).toEqual({
//             conditionType: ConditionType.RequireText
//         });
//     });
//     test('add() with null for conditionType, and other parameters correctly defined', () => {
//         let vhConfig: EvaluateChildConditionResultsBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         }
//         let testItem = new FluentConditionBuilder(vhConfig);
//         let conditionConfig: ConditionConfig = {
//             conditionType: ConditionType.RequireText
//         };

//         expect(() => testItem.add(null, conditionConfig)).not.toThrow();
//         expect(testItem.parentConfig.conditionConfigs!.length).toBe(1);
//         expect(testItem.parentConfig.conditionConfigs![0]).toEqual({
//             conditionType: ConditionType.RequireText
//         });
//     });
// });



// describe('conditions', () => {
//     test('Undefined parameter creates a FluentConditionBuilder with vhConfig containing type=TBD and collectionConfig=[]', () => {
//         let testItem = createFluent().conditions();
//         expect(testItem).toBeInstanceOf(FluentFieldConditionBuilderBase);
//         expect(testItem.getConfig()).toEqual({
//             conditionType: 'TBD',
//             conditionConfigs: []
//         });
//     });
//     test('null parameter creates a FluentConditionBuilder with vhConfig containing type=TBD and collectionConfig=[]', () => {
//         let testItem = createFluent().conditions(null!);
//         expect(testItem).toBeInstanceOf(FluentFieldConditionBuilderBase);
//         expect(testItem.getConfig()).toEqual({
//             conditionType: 'TBD',
//             conditionConfigs: []
//         });
//     });    
//     test('Supplied parameter creates a FluentConditionBuilder with the same vhConfig', () => {
//         let parentConfig: EvaluateChildConditionResultsBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         }
//         let testItem = createFluent().conditions(parentConfig);
//         expect(testItem).toBeInstanceOf(FluentFieldConditionBuilderBase);
//         expect(testItem.getConfig()).toEqual({
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         });
//     });    
//     test('Supplied parameter with conditionConfig=null creates a FluentValidatorBuilder with the same vhConfig and conditionConfig=[]', () => {
//         let parentConfig: EvaluateChildConditionResultsBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: null as unknown as Array<ConditionConfig>
//         }
//         let testItem = createFluent().conditions(parentConfig);
//         expect(testItem).toBeInstanceOf(FluentFieldConditionBuilderBase);
//         expect(testItem.getConfig()).toEqual({
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         });
//     });        
// });


// describe('FluentFactory', () => {
//     test('Constructor followed by create will return an instance of FluentValidatorBuilder with correct vhConfig', () => {
//         let testItem = new FluentFactory();
//         let vhConfig: FieldValueHostConfig = {
//             valueHostType: ValueHostType.Field,
//             name: 'Field1',
//             validatorConfigs: []
//         };
//         let result: IFluentValidatorBuilder | null = null;
//         expect(() => result = testItem.createValidatorBuilder(vhConfig)).not.toThrow();
//         expect(result).toBeInstanceOf(FluentValidatorBuilder);
//         expect(result!.parentConfig).toEqual(vhConfig);
//     });
//     test('Register followed by create returns an instance of the test class with correct vhConfig', () => {
//         class TestFluentValidatorBuilder implements IFluentValidatorBuilder {
//             constructor(vhConfig: FieldValueHostConfig) {
//                 this.parentConfig = { ...vhConfig, dataType: 'test' };
//             }
//             parentConfig: FieldValueHostConfig;
//             add(conditionType: string, conditionConfig: ConditionConfig | null,
//                 errorMessage: string | null, summaryMessage: string | null, validatorConfig: ValidatorConfig): void {
//                 throw new Error('Method not implemented.');
//             }
//         }
//         let testItem = new FluentFactory();
//         testItem.registerValidatorBuilder((vhConfig) => new TestFluentValidatorBuilder(vhConfig));

//         let vhConfig: FieldValueHostConfig = {
//             valueHostType: ValueHostType.Field,
//             name: 'Field1',
//             validatorConfigs: []
//         };
//         let result: IFluentValidatorBuilder | null = null;
//         expect(() => result = testItem.createValidatorBuilder(vhConfig)).not.toThrow();
//         expect(result).toBeInstanceOf(TestFluentValidatorBuilder);
//         expect(result!.parentConfig.dataType).toBe('test');
//     });
//     test('Constructor followed by create will return an instance of FluentConditionBuilder with correct vhConfig', () => {
//         let testItem = new FluentFactory();
//         let vhConfig: EvaluateChildConditionResultsBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         }
//         let result: IFluentConditionBuilder | null = null;
//         expect(() => result = testItem.createConditionBuilder(vhConfig)).not.toThrow();
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result!.parentConfig).toEqual(vhConfig);
//     });
//     test('Register followed by create returns an instance of the test class with correct vhConfig', () => {
//         class TestFluentConditionBuilder implements IFluentConditionBuilder {
//             constructor(vhConfig: EvaluateChildConditionResultsBaseConfig) {
//                 this.parentConfig = { ...vhConfig, conditionType: 'Test' };
//             }
//             parentConfig: EvaluateChildConditionResultsBaseConfig;

//             add(conditionType: string, conditionConfig: Partial<ConditionConfig> | null): void {
//                 throw new Error('Method not implemented.');
//             }
//         }
//         let testItem = new FluentFactory();
//         testItem.registerConditionBuilder((vhConfig) => new TestFluentConditionBuilder(vhConfig));

//         let vhConfig: EvaluateChildConditionResultsBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         }
//         let result: IFluentConditionBuilder | null = null;
//         expect(() => result = testItem.createConditionBuilder(vhConfig)).not.toThrow();
//         expect(result).toBeInstanceOf(TestFluentConditionBuilder);
//         expect(result!.parentConfig.conditionType).toBe('Test');
//     })    
// });

// describe('finishFluentValidatorBuilder ', () => {
//     test('Only FluentValidatorBuilder legal for first parameter. Unexpect type throws', () => {
//         let vmConfig = createVMConfig();

//         let testItem1 = new FluentValidatorBuilder({ name: '', validatorConfigs: [] }); 
//         expect(()=>finishFluentValidatorBuilder(
//             testItem1,
//             '', {}, null, null, null)
//         ).not.toThrow();
//         let testItem2 = new FluentConditionBuilder({ conditionType: '', conditionConfigs: [] });
//         expect(()=>finishFluentValidatorBuilder(
//             testItem2,
//             '', {}, null, null, null)
//         ).toThrow();
//         expect(()=>finishFluentValidatorBuilder(
//             100,
//             '', {}, null, null, null)
//         ).toThrow();       
//         expect(()=>finishFluentValidatorBuilder(
//             null,
//             '', {}, null, null, null)
//         ).toThrow();               
//     });
// });
// describe('finishFluentConditionBuilder ', () => {
//     test('Only FluentConditionBuilder legal for first parameter. Unexpect type throws', () => {
//         let vmConfig = createVMConfig();
//         let testItem1 = new FluentConditionBuilder({conditionType: '', conditionConfigs: [] }); 
//         expect(()=>finishFluentConditionBuilder(
//             testItem1,
//             '', {})
//         ).not.toThrow();
//         let testItem2 = new FluentValidatorBuilder({ name: '', validatorConfigs: [] });
//         expect(()=>finishFluentConditionBuilder(
//             testItem2,
//             '', {})
//         ).toThrow();
//         expect(()=>finishFluentConditionBuilder(
//             100,
//             '', {})
//         ).toThrow();       
//         expect(()=>finishFluentConditionBuilder(
//             null,
//             '', {})
//         ).toThrow();               
//     });
// });
