// import { ConditionType } from "../../src/Conditions/ConditionTypes";
// import { ConditionWithChildrenBaseConfig } from "../../src/Conditions/ConditionWithChildrenBase";
// import { CountMatchesConditionConfig, RequireTextConditionConfig } from '../../src/Conditions/ConcreteConditions';
// import { WhenConditionConfig } from '../../src/Conditions/WhenCondition';
// import { NotConditionConfig } from '../../src/Conditions/NotCondition';

// describe('FluentSingleFieldConditionBuilder tests', () => {
//     test('constructor sets parentConfig', () => {
//         const parentConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         };
//         const builder = new FluentSingleFieldConditionBuilder(parentConfig);
//         expect(builder['parentConfig']).toBe(parentConfig);
//     });
//     test('constructor with null parentConfig sets parentConfig to null', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         expect(builder['parentConfig']).toBeNull();
//     });
//     test('constructor with undefined parentConfig sets parentConfig to undefined', () => {
//         const builder = new FluentSingleFieldConditionBuilder(undefined);
//         expect(builder['parentConfig']).toBeUndefined();
//     });
//     test('parentValue returns a FluentOneConditionBuilder with null valueHostName', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.parentValue();
//         expect(result).toBeInstanceOf(FluentOneConditionBuilder);
//         expect(result.valueHostName).toBeNull();
//     });
//     test('fieldValue returns a FluentOneConditionBuilder with specified valueHostName', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const valueHostName = 'testField';
//         const result = builder.fieldValue(valueHostName);
//         expect(result).toBeInstanceOf(FluentOneConditionBuilder);
//         expect(result.valueHostName).toBe(valueHostName);
//     });
// });

// describe('FluentMultiFieldConditionBuilder tests', () => {
//     test('constructor sets parentConfig', () => {
//         const parentConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         };
//         const builder = new FluentMultiFieldConditionBuilder(parentConfig);
//         expect(builder['parentConfig']).toBe(parentConfig);
//     });
//     test('constructor with null parentConfig sets parentConfig to null', () => {
//         const builder = new FluentMultiFieldConditionBuilder(null);
//         expect(builder['parentConfig']).toBeNull();
//     });
//     test('constructor with undefined parentConfig sets parentConfig to undefined', () => {
//         const builder = new FluentMultiFieldConditionBuilder(undefined);
//         expect(builder['parentConfig']).toBeUndefined();
//     });
//     test('parentValue returns a FluentConditionBuilder with null valueHostName', () => {
//         const builder = new FluentMultiFieldConditionBuilder(null);
//         const result = builder.parentValue();
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.valueHostName).toBeNull();
//     });
//     test('fieldValue returns a FluentConditionBuilder with specified valueHostName', () => {
//         const builder = new FluentMultiFieldConditionBuilder(null);
//         const valueHostName = 'testField';
//         const result = builder.fieldValue(valueHostName);
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.valueHostName).toBe(valueHostName);
//     }); 
// });
// describe('conditionConfig method tests', () => {
//     test('Returns FluentConditionBuilder with specified conditionConfig in parentConfig', () => {
//         const conditionConfig = { conditionType: ConditionType.RequireText, valueHostName: 'Field1' };
//         const expectedParentConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: 'TBD',
//             conditionConfigs: [<RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText,
//                 valueHostName: 'Field1'
//             }]
//         };        
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.conditionConfig(conditionConfig);
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedParentConfig);
//     });
//     test('conditionConfig with valid config returns FluentConditionBuilde with parent', () => {
//         const parentConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         };
//         const conditionConfig = { conditionType: ConditionType.RequireText, valueHostName: 'Field1' };
//         const expectedParentConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: [<RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText,
//                 valueHostName: 'Field1'
//             }]
//         };

//         const builder = new FluentSingleFieldConditionBuilder(parentConfig);
//         const result = builder.conditionConfig(conditionConfig);
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedParentConfig);

//     });    
// });
// describe('all tests (using SingleFieldConditionBuilder)', ()=>{
//     test('all method returns FluentConditionBuilder with All conditionType and correct parentConfig', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.all((allBuilder) => [
//             allBuilder.fieldValue('Field1').requireText(),
//             allBuilder.fieldValue('Field2').requireText()
//         ]);
//         const expectedConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: [
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'Field1'
//                 },
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'Field2'
//                 }
//             ]
//         };
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedConfig);
//     });
//     // one with parentValue
//     test('all method with parentValue returns FluentConditionBuilder with All conditionType and correct parentConfig', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.all((allBuilder) => [
//             allBuilder.parentValue().requireText(),
//             allBuilder.fieldValue('Field2').requireText()
//         ]);
//         const expectedConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: [
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText
//                 },
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'Field2'
//                 }
//             ]
//         };
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedConfig);
//     });
//     // empty child array
//     test('all method with empty child array returns FluentConditionBuilder with All conditionType and empty conditionConfigs', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.all((allBuilder) => []);
//         const expectedConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: ConditionType.All,
//             conditionConfigs: []
//         };
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedConfig);
//     });
// });

// describe('any tests (using SingleFieldConditionBuilder)', ()=>{
//     test('any method returns FluentConditionBuilder with Any conditionType and correct parentConfig', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.any((anyBuilder) => [
//             anyBuilder.fieldValue('Field1').requireText(),
//             anyBuilder.fieldValue('Field2').requireText()
//         ]);
//         const expectedConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: ConditionType.Any,
//             conditionConfigs: [
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'Field1'
//                 },
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'Field2'
//                 }
//             ]
//         };
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedConfig);
//     });
//     // one with parentValue
//     test('any method with parentValue returns FluentConditionBuilder with Any conditionType and correct parentConfig', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.any((anyBuilder) => [
//             anyBuilder.parentValue().requireText(),
//             anyBuilder.fieldValue('Field2').requireText()
//         ]);
//         const expectedConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: ConditionType.Any,
//             conditionConfigs: [
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText
//                 },
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'Field2'
//                 }
//             ]
//         };
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedConfig);
//     });
//     // empty child array
//     test('any method with empty child array returns FluentConditionBuilder with Any conditionType and empty conditionConfigs', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.any((anyBuilder) => []);
//         const expectedConfig: ConditionWithChildrenBaseConfig = {
//             conditionType: ConditionType.Any,
//             conditionConfigs: []
//         };
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedConfig);
//     });
// });

// describe('countMatches tests (using SingleFieldConditionBuilder)', () => {
//     test('countMatches method returns FluentConditionBuilder with CountMatches conditionType and correct parentConfig', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.countMatches(1, 2, (countBuilder) => [
//             countBuilder.fieldValue('Field1').requireText(),
//             countBuilder.fieldValue('Field2').requireText()
//         ]);
//         const expectedConfig: CountMatchesConditionConfig = {
//             conditionType: ConditionType.CountMatches,
//             minimum: 1,
//             maximum: 2,
//             conditionConfigs: [
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'Field1'
//                 },
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'Field2'
//                 }
//             ]
//         };
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedConfig);
//     });
//     // one with parentValue
//     test('countMatches method with parentValue returns FluentConditionBuilder with CountMatches conditionType and correct parentConfig', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.countMatches(1, 2, (countBuilder) => [
//             countBuilder.parentValue().requireText(),
//             countBuilder.fieldValue('Field2').requireText()
//         ]);
//         const expectedConfig: CountMatchesConditionConfig = {
//             conditionType: ConditionType.CountMatches,
//             minimum: 1,
//             maximum: 2,
//             conditionConfigs: [
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText
//                 },
//                 <RequireTextConditionConfig>{
//                     conditionType: ConditionType.RequireText,
//                     valueHostName: 'Field2'
//                 }
//             ]
//         };
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedConfig);
//     });
//     // empty child array
//     test('countMatches method with empty child array returns FluentConditionBuilder with CountMatches conditionType and empty conditionConfigs', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.countMatches(1, 2, (countBuilder) => []);
//         const expectedConfig: CountMatchesConditionConfig = {
//             conditionType: ConditionType.CountMatches,
//             minimum: 1,
//             maximum: 2,
//             conditionConfigs: []
//         };
//         expect(result).toBeInstanceOf(FluentConditionBuilder);
//         expect(result.parentConfig).toEqual(expectedConfig);
//     });
// });

// describe('when tests (using SingleFieldConditionBuilder)', () => {
//     test('when method returns FluentConditionBuilder with When conditionType and correct parentConfig', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         builder.when(
//             (whenBuilder) => whenBuilder.fieldValue('Field1').requireText(),
//             (thenBuilder) => thenBuilder.fieldValue('Field2').requireText()
//         );
//         const expectedConfig: WhenConditionConfig = {
//             conditionType: ConditionType.When,
//             whenToEnableConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText,
//                 valueHostName: 'Field1'
//             },
//             thenConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText,
//                 valueHostName: 'Field2'
//             }
//         };
//         expect(builder.getConfig()).toEqual(expectedConfig);
//     });

//     // one has parentValue
//     test('when method with parentValue returns FluentConditionBuilder with When conditionType and correct parentConfig', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         builder.when(
//             (whenBuilder) => whenBuilder.parentValue().requireText(),
//             (thenBuilder) => thenBuilder.fieldValue('Field2').requireText()
//         );
//         const expectedConfig: WhenConditionConfig = {
//             conditionType: ConditionType.When,
//             whenToEnableConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText
//             },
//             thenConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText,
//                 valueHostName: 'Field2'
//             }
//         };
//         expect(builder.getConfig()).toEqual(expectedConfig);
//     });
// });

// describe('not tests (using SingleFieldConditionBuilder)', () => {
//     test('not method returns FluentOneConditionBuilder with Not conditionType and correct parentConfig', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         builder.not((notBuilder) => notBuilder.fieldValue('Field1').requireText());
//         const expectedConfig: NotConditionConfig = {
//             conditionType: ConditionType.Not,
//             childConditionConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText,
//                 valueHostName: 'Field1'
//             }
//         };
//         expect(builder.getConfig()).toEqual(expectedConfig);
//     });
//     // one has parentValue
//     test('not method with parentValue returns FluentOneConditionBuilder with Not conditionType and correct parentConfig', () => {
//         const builder = new FluentSingleFieldConditionBuilder(null);
//         const result = builder.not((notBuilder) => notBuilder.parentValue().requireText());
//         const expectedConfig: NotConditionConfig = {
//             conditionType: ConditionType.Not,
//             childConditionConfig: <RequireTextConditionConfig>{
//                 conditionType: ConditionType.RequireText
//             }
//         };
//         expect(builder.getConfig()).toEqual(expectedConfig);
//     });
// });