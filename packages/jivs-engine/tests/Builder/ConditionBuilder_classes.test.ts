import { IBuilderConfigHost } from "../../src/Builder/Fluent";
import {
    ConditionBuilder,
    StartConditionBuilder
}
    from "../../src/Builder/ConditionBuilder_classes";
import { EqualToValueConditionConfig, RangeConditionConfig, RequireTextConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { NotConditionConfig } from "../../src/Conditions/NotCondition";
import { WhenConditionConfig } from "../../src/Conditions/WhenCondition";
import { enableConditionBuilderExtensions } from "../../src/Builder/ConditionBuilderExtensions";


class TestParentBuilder implements IBuilderConfigHost {
    public childConfig: object | undefined;
    
    setConfig(childConfig: object): void {
        this.childConfig = childConfig;
    }
    getConfig(): object | undefined {
        return this.childConfig;
    }
}

describe('ConditionBuilder', () => {
    // using expects syntax
    test('ConditionBuilder attaches child RequireTextConditionConfig to its builder; no impact on parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let conditionBuilder = new ConditionBuilder(parentBuilder);
        let childConfig: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null
        };
        conditionBuilder.setConfig(childConfig);
        expect(conditionBuilder.getConfig()).toEqual(childConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });

    // try RangeConditionConfig, which has a secondValue property, to ensure that the builder can handle configs with additional properties
    test('ConditionBuilder attaches child RangeConditionConfig to its builder; no impact on parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let conditionBuilder = new ConditionBuilder(parentBuilder);
        let childConfig: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: null,
            minimum: 1,
            maximum: 10
        };
        conditionBuilder.setConfig(childConfig);
        expect(conditionBuilder.getConfig()).toEqual(childConfig);
        expect(parentBuilder.getConfig()).toBeUndefined();
    });
});

describe('StartConditionBuilder', () => {
    class Publicify_StartConditionBuilder extends StartConditionBuilder {
        public get publicify_ValueHostName(): string | undefined {
            return this.valueHostName;
        }
    }
    describe('parentValue()', () => {
        test('returns a new ConditionBuilder with its own valueHostName property undefined', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new Publicify_StartConditionBuilder(parentBuilder);
            let conditionBuilder = startBuilder.parentValue();
            expect(conditionBuilder).toBeInstanceOf(ConditionBuilder);
            expect((conditionBuilder as any).valueHostName).toBeUndefined();
            expect(startBuilder.publicify_ValueHostName).toBeUndefined();
            expect(parentBuilder.getConfig()).toBeUndefined();
        });
        test('causes setConfig to leave the childConfig.valueHostName property unassigned; parentBuilder gets config', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new Publicify_StartConditionBuilder(parentBuilder);
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
            expect(parentConfig).toEqual(expectedParentConfig);
            expect((parentConfig as any).valueHostName).toBeUndefined();
        });
        // same but valueHostName is null in child
        test('causes setConfig to leave the childConfig.valueHostName alone when its assigned', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new Publicify_StartConditionBuilder(parentBuilder);
            let conditionBuilder = startBuilder.parentValue();
            let childConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field1'
            };
            conditionBuilder.setConfig(childConfig);
            // by design parent must retrieve the child config from the parentBuilder, so we can check that it is correct
            startBuilder.setConfig(conditionBuilder.getConfig()!);  // start builder's setConfig bubbles up

            let parentConfig = parentBuilder.getConfig();
            const expectedParentConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field1'
            };
            expect(conditionBuilder.getConfig()).toEqual(childConfig);
            expect(startBuilder.getConfig()).toEqual(expectedParentConfig);
            expect(parentConfig).toEqual(expectedParentConfig);
            expect((parentConfig as any).valueHostName).toEqual('Field1');
        });
    });
    describe('fieldValue()', () => {
        test('returns a new ConditionBuilder with its own valueHostName property assigned to the supplied field name', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new Publicify_StartConditionBuilder(parentBuilder);
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
            expect(parentConfig).toEqual(expectedParentConfig);
            expect((parentConfig as any).valueHostName).toEqual('myField');
        });
        test('when the child has valueHostName assigned, setConfig should not overwrite it with the supplied field name', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new Publicify_StartConditionBuilder(parentBuilder);
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
            expect(startBuilder.publicify_ValueHostName).toEqual('myField');
            expect(parentConfig).toEqual(expectedParentConfig);
            expect((parentConfig as any).valueHostName).toEqual('childField');
        });
        test('when the child has valueHostName assigned to null, setConfig should overwrite it with the supplied field name', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new Publicify_StartConditionBuilder(parentBuilder);
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
            expect(startBuilder.publicify_ValueHostName).toEqual('myField');
            expect(parentConfig).toEqual(expectedParentConfig);
            expect((parentConfig as any).valueHostName).toEqual('myField');
        });
    });
});

describe('when()', () => {
    test('creates a WhenConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.when(
            (whenBuilder) =>
                // normally the whenBuilder would be used to create a child condition config, but for this test we can just return a config directly
                <EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                },
            (thenBuilder) => <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText
            });
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
        expect(parentConfig).toEqual(expectedParentConfig);
        expect(startBuilderConfig).toEqual(expectedParentConfig);
    });
    // null first parameter throws
    test('when() throws when first parameter is null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        expect(() => {
            startBuilder.when(
                null!,
                (thenBuilder) => <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText
                });
        }).toThrow('whenToEnableCallback required');
    });
    // null second parameter throws
    test('when() throws when second parameter is null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        expect(() => {
            startBuilder.when(
                (whenBuilder) => <EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                },
                null!);
        }).toThrow('thenCallback required');
    });
    // when config is null
    test('when() throws when whenToEnableCallback returns null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        expect(() => {
            startBuilder.when(
                (whenBuilder) => null!,
                (thenBuilder) => <RequireTextConditionConfig>{
                    conditionType: ConditionType.RequireText
                });
        }).toThrow('whenToEnableConfig required');
    });
    // then config is null
    test('when() throws when thenCallback returns null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        expect(() => {
            startBuilder.when(
                (whenBuilder) => <EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    secondValue: 5
                },
                (thenBuilder) => null!);
        }).toThrow('thenConfig required');
    });
    // startBuilder.parentValue().when() to show when comes from ConditionBuilder
    test('startBuilder.parentValue().when() creates a WhenConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        let conditionBuilder = startBuilder.parentValue();
        conditionBuilder.when(
            (whenBuilder) => <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 5
            },
            (thenBuilder) => <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }); 
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
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // using startBuilder.fieldValue().when() to show when comes from ConditionBuilder
    test('startBuilder.fieldValue().when() creates a WhenConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        let conditionBuilder = startBuilder.fieldValue('myField');
        conditionBuilder.when(
            (whenBuilder) => <EqualToValueConditionConfig>{
                conditionType: ConditionType.EqualToValue,
                secondValue: 5
            },
            (thenBuilder) => <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            });
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
            },
            thenConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }
        };
        expect(conditionConfig).toEqual(expectedParentConfig);
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
});

describe('not()', () => {
    test('creates a NotConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.not(
            (notBuilder) => <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            });
        // because we didn't use a function to create the child configs and use setConfig,
        // we have to do it here;
        startBuilder.setConfig(startBuilder.getConfig()!);

        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // with valuehost in child
    test('creates a NotConditionConfig with child valueHostName and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.not(
            (notBuilder) => <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'childField'
            });
        // because we didn't use a function to create the child configs and use setConfig,
        // we have to do it here;
        startBuilder.setConfig(startBuilder.getConfig()!);

        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'childField'
            }
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // starterBuilder.parentValue.not
    test('startBuilder.parentValue().not() creates a NotConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        let conditionBuilder = startBuilder.parentValue();
        conditionBuilder.not(
            (notBuilder) => <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            });
        // because we didn't use a function to create the child configs and use setConfig,
        // we have to do it here;
        startBuilder.setConfig(conditionBuilder.getConfig()!);
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            }
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    test('startBuilder.fieldValue().not() creates a NotConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        let conditionBuilder = startBuilder.fieldValue('myField');
        conditionBuilder.not(
            (notBuilder) => <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
            });
        // because we didn't use a function to create the child configs and use setConfig,
        // we have to do it here;
        startBuilder.setConfig(conditionBuilder.getConfig()!);
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.Not,
            valueHostName: 'myField',   // even though it does not exist as a property on the NotConditionConfig
            childConditionConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText
                // notice it does not have valueHostName: 'myField' here. Only updates immediate children
            }
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
});

describe('all()', () => {
    // with 1 child condition
    test('creates an AllConditionConfig with 1 child condition and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.all(
            (allBuilder) => {
                let a = [
                    { // not using setConfig, but it should even though this happens to work
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    }
                ];
                for (let cond of a) {
                    allBuilder.setConfig(cond);
                }
                return a;
                
            });
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
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
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // 3 child conditions
    test('creates an AllConditionConfig with 3 child conditions and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.all(
            (allBuilder) => {
                let a = [
                    {
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    },
                    {
                        conditionType: ConditionType.EqualToValue,
                        secondValue: 5
                    },
                    {
                        valueHostName: 'F2',
                        conditionType: ConditionType.Range,
                        minimum: 1,
                        maximum: 10
                    }
                ];
                for (let cond of a) {
                    allBuilder.setConfig(cond);
                }
                return a;
            });
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
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
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // empty array
    test('creates an AllConditionConfig with no child conditions and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.all(
            (allBuilder) => {
                return [];
            }
        );
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.All,
            conditionConfigs: []
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // null callback throws
    test('all() throws when callback is null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        expect(() => {
            startBuilder.all(null!);
        }).toThrow('childrenCallback required');
    });

    // starterBuilder.parentValue().all() to show all comes from ConditionBuilder
    test('startBuilder.parentValue().all() creates an AllConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        let conditionBuilder = startBuilder.parentValue();
        conditionBuilder.all(
            (allBuilder) => {
                let a = [
                    {
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    }
                ];
                for (let cond of a) {
                    allBuilder.setConfig(cond);
                }
                return a;
            }
        );
        let conditionConfig = conditionBuilder.getConfig();
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
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
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // startBuilder.fieldValue().all() to show all comes from ConditionBuilder
    test('startBuilder.fieldValue().all() creates an AllConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        let conditionBuilder = startBuilder.fieldValue('myField');
        conditionBuilder.all(
            (allBuilder) => {
                let a = [
                    {
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    }
                ];
                for (let cond of a) {
                    allBuilder.setConfig(cond);
                }
                return a;
            }
        );
        let conditionConfig = conditionBuilder.getConfig();
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.All,
            valueHostName: 'myField',   // even though it does not exist as a property on the AllConditionConfig
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };
        expect(conditionConfig).toEqual(expectedParentConfig);
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
});

describe('any()', () => {
    // with 1 child condition
    test('creates an AnyConditionConfig with 1 child condition and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.any(
            (anyBuilder) => {
                let a = [
                    {
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    }
                ];
                for (let cond of a) {
                    anyBuilder.setConfig(cond);
                }
                return a;
            
            });
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
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
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // 3 child conditions
    test('creates an AnyConditionConfig with 3 child conditions and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.any(
            (anyBuilder) => {
                let a = [
                    {
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    },
                    {
                        conditionType: ConditionType.EqualToValue,
                        secondValue: 5
                    },
                    {
                        valueHostName: 'F2',
                        conditionType: ConditionType.Range,
                        minimum: 1,
                        maximum: 10
                    }
                ];
                for (let cond of a) {
                    anyBuilder.setConfig(cond);
                }
                return a;
            });
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
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
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // empty array
    test('creates an AnyConditionConfig with no child conditions and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.any(
            (anyBuilder) => []
        );
        const expectedParentConfig = {
            conditionType: ConditionType.Any,
            conditionConfigs: []
        };
        const parentConfig = parentBuilder.getConfig();
        expect(parentConfig).toEqual(expectedParentConfig);
    }); 
    // null callback throws
    test('any() throws when callback is null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        expect(() => {
            startBuilder.any(null!);
        }).toThrow('childrenCallback required');
    });

    // starterBuilder.parentValue().any() to show any comes from ConditionBuilder
    test('startBuilder.parentValue().any() creates an AnyConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        let conditionBuilder = startBuilder.parentValue();
        conditionBuilder.any(
            (anyBuilder) => {
                let a = [
                    {
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    }
                ];  
                for (let cond of a) {
                    anyBuilder.setConfig(cond);
                }
                return a;
            }
        );
        let conditionConfig = conditionBuilder.getConfig();
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
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
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // startBuilder.fieldValue().any() to show any comes from ConditionBuilder
    test('startBuilder.fieldValue().any() creates an AnyConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        let conditionBuilder = startBuilder.fieldValue('myField');
        conditionBuilder.any(
            (anyBuilder) => {
                let a = [
                    {
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    }
                ];
                for (let cond of a) {
                    anyBuilder.setConfig(cond);
                }
                return a;
            }
        );
        let conditionConfig = conditionBuilder.getConfig();
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.Any,
            valueHostName: 'myField',   // even though it does not exist as a property on the AnyConditionConfig
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };
        expect(conditionConfig).toEqual(expectedParentConfig);
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
});

describe('countMatches()', () => {
    test('creates a CountMatchesConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.countMatches(1, 3,
            (countMatchesBuilder) => {
                let a = [
                    {
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    }
                ];
                for (let cond of a) {
                    countMatchesBuilder.setConfig(cond);
                }
                return a;
            }
        );
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
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
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // focus on the minimum and maximum properties with null on one or the other.
    // Use empty array for child conditions to keep it simple.
    test('creates a CountMatchesConditionConfig with null minimum and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.countMatches(null, 3,
            (countMatchesBuilder) => []
        );
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            maximum: 3,
            conditionConfigs: []
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    test('creates a CountMatchesConditionConfig with null maximum and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        startBuilder.countMatches(1, null,
            (countMatchesBuilder) => []
        );
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            conditionConfigs: []
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // null callback throws
    test('countMatches() throws when callback is null', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        expect(() => {
            startBuilder.countMatches(1, 3, null!);
        }).toThrow();
    });
    // starterBuilder.parentValue().countMatches() to show countMatches comes from ConditionBuilder
    test('startBuilder.parentValue().countMatches() creates a CountMatchesConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        let conditionBuilder = startBuilder.parentValue();
        conditionBuilder.countMatches(1, 3,
            (countMatchesBuilder) => {
                let a = [
                    {
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    }
                ];
                for (let cond of a) {
                    countMatchesBuilder.setConfig(cond);
                }
                return a;
            }
        );
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
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
        expect(parentConfig).toEqual(expectedParentConfig);
    });
    // startBuilder.fieldValue().countMatches() to show countMatches comes from ConditionBuilder
    test('startBuilder.fieldValue().countMatches() creates a CountMatchesConditionConfig and assigns it to the parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let startBuilder = new StartConditionBuilder(parentBuilder);
        let conditionBuilder = startBuilder.fieldValue('myField');
        conditionBuilder.countMatches(1, 3,
            (countMatchesBuilder) => {
                let a = [
                    {
                        conditionType: ConditionType.RequireText,
                        valueHostName: 'F1'
                    }
                ];
                for (let cond of a) {
                    countMatchesBuilder.setConfig(cond);
                }
                return a;
            }
        );
        let startBuilderConfig = startBuilder.getConfig();
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.CountMatches,
            minimum: 1,
            maximum: 3,
            valueHostName: 'myField',   // even though it does not exist as a property on the CountMatchesConditionConfig
            conditionConfigs: [
                {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'F1'
                }
            ]
        };
        expect(startBuilderConfig).toEqual(expectedParentConfig);
        expect(parentConfig).toEqual(expectedParentConfig);
    });
});