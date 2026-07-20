import { BuildersFactoryInstaller } from './../../src/Services/BuildersFactoryInstaller';
import {
    EqualToValueConditionConfig, RangeConditionConfig, RequireTextConditionConfig
} from "@plblum/jivs-engine/build/Conditions/ConcreteConditions";
import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import { NotConditionConfig } from "@plblum/jivs-engine/build/Conditions/NotCondition";
import { WhenConditionConfig } from "@plblum/jivs-engine/build/Conditions/WhenCondition";
import { ConditionConfig } from "@plblum/jivs-engine/build/Interfaces/Conditions";
import { IValidationServices } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { createValidationServicesForTesting } from '@plblum/jivs-engine/build/Support/createValidationServicesForTesting';
import {
    ConditionBuilder
} from "../../src/Builder/ConditionBuilder";
import {
    StartConditionBuilder
} from "../../src/Builder/StartConditionBuilder";
import { CompleteConfigBuilderHandler, IBuilderConfigHost } from "../../src/Interfaces/ChildBuilders";


class TestParentBuilder implements IBuilderConfigHost<object> {
    constructor() {
        this.completed = (config: object, source: IBuilderConfigHost<object>) => {
            this.completedConfig = config;
        };
    }
    public childConfig: object | undefined;
    public completedConfig?: object | undefined;
    
    setConfig(childConfig: object): void {
        this.childConfig = childConfig;
    }
    getConfig(): object | undefined {
        return this.childConfig;
    }

    completed?: CompleteConfigBuilderHandler<object>;
}

let services: IValidationServices;

beforeAll(() => {
    new BuildersFactoryInstaller();  // this will install buildersFactory on ValidationServices.prototype
    services = createValidationServicesForTesting(); 
});

describe('StartConditionBuilder', () => {
    describe('parentValue()', () => {
        test('returns a new ConditionBuilder with its own valueHostName property undefined', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new StartConditionBuilder(services, parentBuilder);
            let conditionBuilder = startBuilder.parentValue();
            expect(conditionBuilder).toBeInstanceOf(ConditionBuilder);
            expect((conditionBuilder as any).valueHostName).toBeUndefined();
            expect(startBuilder.valueHostName).toBeUndefined();
            expect(parentBuilder.getConfig()).toBeUndefined();
        });
        test('causes setConfig to leave the childConfig.valueHostName property unassigned; parentBuilder gets config', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new StartConditionBuilder(services, parentBuilder);
            let conditionBuilder = startBuilder.parentValue();
            let childConfig = {
                conditionType: ConditionType.RequireText
            };
            conditionBuilder.setConfig(childConfig);
            // by design parent must retrieve the child config from the parentBuilder, so we can check that it is correct
            startBuilder.setConfig(conditionBuilder.getConfig()!);  // start builder's setConfig bubbles up

            let parentConfig = parentBuilder.getConfig();
            const expectedParentConfig = {
                conditionType: ConditionType.RequireText
            };
            expect(conditionBuilder.getConfig()).toEqual(childConfig);
            expect(startBuilder.getConfig()).toEqual(expectedParentConfig);
            expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
            expect((parentBuilder.completedConfig as any).valueHostName).toBeUndefined();
            // the parentBuilder.setConfig is not called as the children use completed to notify
            expect(parentBuilder.childConfig).toBeUndefined();
        });
        // same but valueHostName is null in child
        test('causes setConfig to leave the childConfig.valueHostName alone when its assigned', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new StartConditionBuilder(services, parentBuilder);
            let conditionBuilder = startBuilder.parentValue();
            let childConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: 'myField'
            };
            conditionBuilder.setConfig(childConfig);
            // by design parent must retrieve the child config from the parentBuilder, so we can check that it is correct
            startBuilder.setConfig(conditionBuilder.getConfig()!);  // start builder's setConfig bubbles up

            let parentConfig = parentBuilder.getConfig();
            const expectedParentConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: 'myField'
            };
            expect(conditionBuilder.getConfig()).toEqual(childConfig);
            expect(startBuilder.getConfig()).toEqual(expectedParentConfig);
            expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
            expect((parentBuilder.completedConfig as any).valueHostName).toEqual('myField');
            // the parentBuilder.setConfig is not called as the children use completed to notify
            expect(parentBuilder.childConfig).toBeUndefined();
        });
    });
    describe('fieldValue()', () => {
        test('returns a new ConditionBuilder with its own valueHostName property assigned to the supplied field name', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new StartConditionBuilder(services, parentBuilder);
            let conditionBuilder = startBuilder.fieldValue('myField');
            let childConfig = {
                conditionType: ConditionType.RequireText
            };
            conditionBuilder.setConfig(childConfig);
            // by design parent must retrieve the child config from the parentBuilder, so we can check that it is correct
            startBuilder.setConfig(conditionBuilder.getConfig()!);  // start builder's setConfig bubbles up

            let parentConfig = parentBuilder.getConfig();
            const expectedParentConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: 'myField'
            };
            expect(conditionBuilder.getConfig()).toEqual(childConfig);
            expect(startBuilder.getConfig()).toEqual(expectedParentConfig);
            expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
            expect((parentBuilder.completedConfig as any).valueHostName).toEqual('myField');
            // the parentBuilder.setConfig is not called as the children use completed to notify
            expect(parentBuilder.childConfig).toBeUndefined();
        });
        test('when the child has valueHostName assigned, setConfig should not overwrite it with the supplied field name', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new StartConditionBuilder(services, parentBuilder);
            let conditionBuilder = startBuilder.fieldValue('myField');
            let childConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: 'childField'
            };
            conditionBuilder.setConfig(childConfig);
            // by design parent must retrieve the child config from the parentBuilder, so we can check that it is correct
            startBuilder.setConfig(conditionBuilder.getConfig()!);  // start builder's setConfig bubbles up

            let parentConfig = parentBuilder.getConfig();
            const expectedParentConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: 'childField'
            };
            expect(conditionBuilder.getConfig()).toEqual(childConfig);
            expect(startBuilder.getConfig()).toEqual(expectedParentConfig);
            expect(startBuilder.valueHostName).toEqual('myField');
            expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
            expect((parentBuilder.completedConfig as any).valueHostName).toEqual('childField');
            // the parentBuilder.setConfig is not called as the children use completed to notify
            expect(parentBuilder.childConfig).toBeUndefined();
        });
        test('when the child has valueHostName assigned to null, setConfig should overwrite it with the supplied field name', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new StartConditionBuilder(services, parentBuilder);
            let conditionBuilder = startBuilder.fieldValue('myField');
            let childConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: null
            };
            conditionBuilder.setConfig(childConfig);
            // by design parent must retrieve the child config from the parentBuilder, so we can check that it is correct
            startBuilder.setConfig(conditionBuilder.getConfig()!);  // start builder's setConfig bubbles up
            let parentConfig = parentBuilder.getConfig();
            const expectedParentConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: 'myField'
            };
            expect(conditionBuilder.getConfig()).toEqual(childConfig);
            expect(startBuilder.getConfig()).toEqual(expectedParentConfig);
            expect(startBuilder.valueHostName).toEqual('myField');
            expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
            expect((parentBuilder.completedConfig as any).valueHostName).toEqual('myField');
            // the parentBuilder.setConfig is not called as the children use completed to notify
            expect(parentBuilder.childConfig).toBeUndefined();
        });
    });
});

/**
 * Gives a distinct naming in the variables so we know its not
 * one of those used within the when and not code.
 */
class TopLevelStartConditionBuilder extends StartConditionBuilder {
    constructor(
        services: IValidationServices, parentBuilder: IBuilderConfigHost<object>,
        completed?: CompleteConfigBuilderHandler<ConditionConfig>
    ) {
        super(services, parentBuilder, completed);
    }
}
describe('when()', () => {
    test('creates a WhenConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new TopLevelStartConditionBuilder(services, parentBuilder);
        startBuilder.when(
            (whenBuilder) =>
                // normally the whenBuilder would be used to create a child condition config, but for this test we can just return a config directly
                whenBuilder.conditionConfig(<EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                }),
            (thenBuilder) =>
                thenBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText
                }));
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig: WhenConditionConfig = {
            conditionType: ConditionType.When,
            whenToEnableConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 5,
            },
            thenConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect((parentBuilder.completedConfig as any).valueHostName).toBeUndefined();
        // the parentBuilder.setConfig is not called as the children use completed to notify
        expect(parentBuilder.childConfig).toBeUndefined();        
    });
    // null first parameter throws
    test('when() throws when first parameter is null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => {
            startBuilder.when(
                null!,
                (thenBuilder) => thenBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText
                }));
        }).toThrow('whenToEnableCallback required');
    });
    // null second parameter throws
    test('when() throws when second parameter is null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => {
            startBuilder.when(
                (whenBuilder) => whenBuilder.conditionConfig(<EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                }),
                null!);
        }).toThrow('thenCallback required');
    });
    // when config is null
    test('when() throws when whenToEnableCallback returns null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => {
            startBuilder.when(
                (whenBuilder) => null!,
                (thenBuilder) => thenBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText
                }));
        }).toThrow('whenToEnableConfig required');
    });
    // then config is null
    test('when() throws when thenCallback returns null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => {
            startBuilder.when(
                (whenBuilder) => whenBuilder.conditionConfig(<EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                }),
                (thenBuilder) => null!);
        }).toThrow('thenConfig required');
    });
    // startBuilder.parentValue().when() to show when comes from ConditionBuilder
    test('startBuilder.parentValue().when() creates a WhenConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        let conditionBuilder = startBuilder.parentValue();
        conditionBuilder.when(
            (whenBuilder) => whenBuilder.conditionConfig(<EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 5
            }),
            (thenBuilder) => thenBuilder.conditionConfig(<RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }));

        // because we didn't use a function to create the child configs and use setConfig,
        // we have to do it here;
        startBuilder.setConfig(conditionBuilder.getConfig()!);

        let conditionConfig = conditionBuilder.getConfig();
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig: WhenConditionConfig = {
            conditionType: ConditionType.When,
            whenToEnableConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 5,
            },
            thenConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }
        };
        expect(conditionConfig).toEqual(expectedParentConfig);
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect((parentBuilder.completedConfig as any).valueHostName).toBeUndefined();
        // the parentBuilder.setConfig is not called as the children use completed to notify
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // using startBuilder.fieldValue().when() to show when comes from ConditionBuilder
    test('startBuilder.fieldValue().when() creates a WhenConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        let conditionBuilder = startBuilder.fieldValue('myField');
        conditionBuilder.when(
            (whenBuilder) => whenBuilder.conditionConfig(<EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 5
                // will inherit valuehostName='myField'
            }),
            (thenBuilder) => thenBuilder.conditionConfig(<RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
                // will inherit valuehostName='myField'
            }));

        // because we didn't use a function to create the child configs and use setConfig,
        // we have to do it here;
        startBuilder.setConfig(conditionBuilder.getConfig()!);

        let conditionConfig = conditionBuilder.getConfig();
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.When,
            valueHostName: 'myField',   // even though it does not exist as a property on the WhenConditionConfig
            whenToEnableConfig: <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 5,
                valueHostName: 'myField'
            },
            thenConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'myField'
            }
        };
        expect(conditionConfig).toEqual(expectedParentConfig);
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect((parentBuilder.completedConfig as any).valueHostName).toEqual('myField');
        // the parentBuilder.setConfig is not called as the children use completed to notify
        expect(parentBuilder.childConfig).toBeUndefined();
    });
});

describe('not()', () => {
    test('creates a NotConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.not(
            (notBuilder) => notBuilder.conditionConfig(<RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }));

        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect((parentBuilder.completedConfig as any).valueHostName).toBeUndefined();
        // the parentBuilder.setConfig is not called as the children use completed to notify
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // with valuehost in child
    test('creates a NotConditionConfig with child valueHostName and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.not(
            (notBuilder) => notBuilder.conditionConfig(<RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'childField'
            }));

        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'childField'
            }
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        // the parentBuilder.setConfig is not called as the children use completed to notify
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // starterBuilder.parentValue.not
    test('startBuilder.parentValue().not() creates a NotConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        let conditionBuilder = startBuilder.parentValue();
        conditionBuilder.not(
            (notBuilder) => notBuilder.conditionConfig(<RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }));

        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        // the parentBuilder.setConfig is not called as the children use completed to notify
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    test('startBuilder.fieldValue().not() creates a NotConditionConfig and assigns it to the parent builder. The child of not get valuesHostName passed through', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        let conditionBuilder = startBuilder.fieldValue('myField');
        conditionBuilder.not(
            (notBuilder) => notBuilder.conditionConfig(<RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }));

        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.Not,
            valueHostName: 'myField',   // even though it does not exist as a property on the NotConditionConfig
            childConditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'myField' // startConditionBuilder is supplied the child too
            }
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        // the parentBuilder.setConfig is not called as the children use completed to notify
        expect(parentBuilder.childConfig).toBeUndefined();
    });
});

describe('all()', () => {
    // with 1 child condition
    test('creates an AllConditionConfig with 1 child condition and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.all(
            (allBuilder) => {
                allBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
            });
        let startBuilderConfig = startBuilder.getConfig();

        const expectedParentConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        // the parentBuilder.setConfig is not called as the children use completed to notify
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // 3 child conditions
    test('creates an AllConditionConfig with 3 child conditions and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.all(
            (allBuilder) => {
                allBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
                allBuilder.conditionConfig(<EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                });
                allBuilder.conditionConfig(<RangeConditionConfig>{
                    conditionType: ConditionType.Range,
                    minimum: 1,
                    maximum: 10,
                    valueHostName: 'F2'
                });
            });
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                },
                {
                    conditionType: ConditionType.Range,
                    minimum: 1,
                    maximum: 10,
                    valueHostName: 'F2'
                }
            ]
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // same but use fieldValue in each child to define the valuehostname instead of using the predefined property
    test('Child condition uses the valueHostName from fieldValue if not already set', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.all(
            (allBuilder) => {
                allBuilder.fieldValue('NotUsed').conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
                allBuilder.fieldValue('Field2').conditionConfig(<EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                });
            });
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5,
                    valueHostName: 'Field2'
                }
            ]
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // empty array
    test('creates an AllConditionConfig with no child conditions and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.all(
            (allBuilder) => {
            }
        );
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // null callback throws
    test('all() throws when callback is null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => {
            startBuilder.all(null!);
        }).toThrow('childrenCallback required');
    });

    // starterBuilder.parentValue().all() to show all comes from ConditionBuilder
    test('startBuilder.parentValue().all() creates an AllConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        let conditionBuilder = startBuilder.parentValue();
        conditionBuilder.all(
            (allBuilder) => {
                allBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
            }
        );
        let conditionConfig = conditionBuilder.getConfig();
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };
        expect(conditionConfig).toEqual(expectedParentConfig);
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // startBuilder.fieldValue().all() to show all comes from ConditionBuilder
    test('startBuilder.fieldValue().all() creates an AllConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        let conditionBuilder = startBuilder.fieldValue('myField');
        conditionBuilder.all(
            (allBuilder) => {
                allBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
                allBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText
                    // will inherit myField
                });
            }
        );

        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.All,
            valueHostName: 'myField',   // even though it does not exist as a property on the AllConditionConfig
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myField'
                }
            ]
        };

        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
});

describe('any()', () => {
    // with 1 child condition
    test('creates an AnyConditionConfig with 1 child condition and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.any(
            (allBuilder) => {
                allBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
            });
        let startBuilderConfig = startBuilder.getConfig();

        const expectedParentConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        // the parentBuilder.setConfig is not called as the children use completed to notify
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // 3 child conditions
    test('creates an AnyConditionConfig with 3 child conditions and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.any(
            (allBuilder) => {
                allBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
                allBuilder.conditionConfig(<EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                });
                allBuilder.conditionConfig(<RangeConditionConfig>{
                    conditionType: ConditionType.Range,
                    minimum: 1,
                    maximum: 10,
                    valueHostName: 'F2'
                });
            });
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                },
                {
                    conditionType: ConditionType.Range,
                    minimum: 1,
                    maximum: 10,
                    valueHostName: 'F2'
                }
            ]
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // same but use fieldValue in each child to define the valuehostname instead of using the predefined property
    test('Child condition uses the valueHostName from fieldValue if not already set', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.any(
            (allBuilder) => {
                allBuilder.fieldValue('NotUsed').conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
                allBuilder.fieldValue('Field2').conditionConfig(<EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                });
            });
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5,
                    valueHostName: 'Field2'
                }
            ]
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // empty array
    test('creates an AnyConditionConfig with no child conditions and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.any(
            (allBuilder) => {
            }
        );
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: []
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // null callback throws
    test('any() throws when callback is null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => {
            startBuilder.any(null!);
        }).toThrow('childrenCallback required');
    });

    // starterBuilder.parentValue().any() to show any comes from ConditionBuilder
    test('startBuilder.parentValue().any() creates an AnyConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        let conditionBuilder = startBuilder.parentValue();
        conditionBuilder.any(
            (allBuilder) => {
                allBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
            }
        );
        let conditionConfig = conditionBuilder.getConfig();
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };
        expect(conditionConfig).toEqual(expectedParentConfig);
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // startBuilder.fieldValue().any() to show any comes from ConditionBuilder
    test('startBuilder.fieldValue().any() creates an AnyConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        let conditionBuilder = startBuilder.fieldValue('myField');
        conditionBuilder.any(
            (allBuilder) => {
                allBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
                allBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText
                    // will inherit myField
                });
            }
        );

        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.Any,
            valueHostName: 'myField',   // even though it does not exist as a property on the AnyConditionConfig
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myField'
                }
            ]
        };

        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
});



describe('countMatches()', () => {
    // with 1 child condition
    test('creates a CountMatchesConditionConfig with 1 child condition and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.countMatches(
            1, 3,
            (countMatchesBuilder) => {
                countMatchesBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
            });
        let startBuilderConfig = startBuilder.getConfig();

        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 3,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // 3 child conditions
    test('creates an CountMatchesConditionConfig with 3 child conditions and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.countMatches(
            1, 3,
            (countMatchesBuilder) => {
                countMatchesBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
                countMatchesBuilder.conditionConfig(<EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                });
                countMatchesBuilder.conditionConfig(<RangeConditionConfig>{
                    conditionType: ConditionType.Range,
                    minimum: 1,
                    maximum: 10,
                    valueHostName: 'F2'
                });
            });
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 3,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                },
                {
                    conditionType: ConditionType.Range,
                    minimum: 1,
                    maximum: 10,
                    valueHostName: 'F2'
                }
            ]
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // same but use fieldValue in each child to define the valuehostname instead of using the predefined property
    test('Child condition uses the valueHostName from fieldValue if not already set', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.countMatches(
            1, 3,
            (countMatchesBuilder) => {
                countMatchesBuilder.fieldValue('NotUsed').conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
                countMatchesBuilder.fieldValue('Field2').conditionConfig(<EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                });
            });
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 3,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5,
                    valueHostName: 'Field2'
                }
            ]
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // empty array
    test('creates an CountMatchesConditionConfig with no child conditions and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.countMatches(
            1, 3,
            (countMatchesBuilder) => {
            }
        );
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 3,
            conditionConfigs: []
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // null ccountMatchesback throws
    test('countMatches() throws when ccountMatchesback is null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        expect(() => {
            startBuilder.countMatches(1, 3, null!);
        }).toThrow('childrenCallback required');
    });

    // starterBuilder.parentValue().countMatches() to show countMatches comes from ConditionBuilder
    test('startBuilder.parentValue().countMatches() creates an CountMatchesConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        let conditionBuilder = startBuilder.parentValue();
        conditionBuilder.countMatches(
            1, 3,
            (countMatchesBuilder) => {
                countMatchesBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
            }
        );
        let conditionConfig = conditionBuilder.getConfig();
        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 3,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };
        expect(conditionConfig).toEqual(expectedParentConfig);
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // startBuilder.fieldValue().countMatches() to show countMatches comes from ConditionBuilder
    test('startBuilder.fieldValue().countMatches() creates an CountMatchesConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        let conditionBuilder = startBuilder.fieldValue('myField');
        conditionBuilder.countMatches(
            1, 3,
            (countMatchesBuilder) => {
                countMatchesBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
                countMatchesBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText
                    // will inherit myField
                });
            }
        );

        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 3,
            valueHostName: 'myField',   // even though it does not exist as a property on the CountMatchesConditionConfig
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                },
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'myField'
                }
            ]
        };

        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // minimum = null, it is not in the config
    test('startBuilder.countMatches() with minimum = null does not include minimum in the config', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.countMatches(
            null, 3,
            (countMatchesBuilder) => {
                countMatchesBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
            }
        );

        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            maximum: 3,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };

        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
    // maximum = null, it is not in the config
    test('startBuilder.countMatches() with maximum = null does not include maximum in the config', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(services, parentBuilder);
        startBuilder.countMatches(
            1, null,
            (countMatchesBuilder) => {
                countMatchesBuilder.conditionConfig(<RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                });
            }
        );

        let startBuilderConfig = startBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };

        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.completedConfig).toEqual(expectedParentConfig);
        expect(parentBuilder.childConfig).toBeUndefined();
    });
});

