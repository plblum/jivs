import { IBuilderUsingConditions } from "../../src/Builder/Fluent";
import {
    ConditionBuilder, NotConditionChildBuilder,
    WhenToEnableBuilder, ThenBuilder,
    StartConditionBuilder
}
    from "../../src/Builder/ConditionBuilder_classes";
import { RangeConditionConfig, RequireTextConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { NotConditionConfig } from "../../src/Conditions/NotCondition";
import { WhenConditionConfig } from "../../src/Conditions/WhenCondition";


class TestParentBuilder implements IBuilderUsingConditions {
    public childConfig: object | undefined;
    
    attachChildConfig(childConfig: object): void {
        this.childConfig = childConfig;
    }
    getConfig(): object | undefined {
        return this.childConfig;
    }
}

describe('ConditionBuilder', () => {
    // using expects syntax
    test('ConditionBuilder attaches child RequireTextConditionConfig to parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let conditionBuilder = new ConditionBuilder(parentBuilder);
        let childConfig: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null
        };
        conditionBuilder.attachChildConfig(childConfig);
        expect(parentBuilder.getConfig()).toEqual(childConfig);
        expect(conditionBuilder.getConfig()).toEqual(childConfig);
    });

    // try RangeConditionConfig, which has a secondValue property, to ensure that the builder can handle configs with additional properties
    test('ConditionBuilder attaches child RangeConditionConfig to parent builder', () => {
        let parentBuilder = new TestParentBuilder();
        let conditionBuilder = new ConditionBuilder(parentBuilder);
        let childConfig: RangeConditionConfig = {
            conditionType: ConditionType.Range,
            valueHostName: null,
            minimum: 1,
            maximum: 10
        };
        conditionBuilder.attachChildConfig(childConfig);
        expect(parentBuilder.getConfig()).toEqual(childConfig);
        expect(conditionBuilder.getConfig()).toEqual(childConfig);
    });
});

describe('NotConditionChildBuilder', () => {
    test('NotConditionChildBuilder expects to update parents config assigning childConditionConfig', () => {
        let parentBuilder = new TestParentBuilder();
        parentBuilder.childConfig = {
            conditionType: ConditionType.Not
        };
        let childBuilder = new NotConditionChildBuilder(parentBuilder);
        let childConfig: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null
        };
        childBuilder.attachChildConfig(childConfig);
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig: NotConditionConfig = {
            conditionType: ConditionType.Not,
            childConditionConfig: childConfig   // this gets assigned by attachChildConfig
        };
        expect(parentConfig).toEqual(expectedParentConfig);
        expect(childBuilder.getConfig()).toEqual(childConfig);
    });
    // same but proves it doesn't care what the parent object is.
    test('NotConditionChildBuilder expects to update parents config assigning childConditionConfig, even if the parent is not a NotConditionConfig', () => {
        let parentBuilder = new TestParentBuilder();
        parentBuilder.childConfig = {
            conditionType: ConditionType.NotNull
        };
        let childBuilder = new NotConditionChildBuilder(parentBuilder);
        let childConfig: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null
        };
        childBuilder.attachChildConfig(childConfig);
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig: NotConditionConfig = {
            conditionType: ConditionType.NotNull,   // this has not changed
            childConditionConfig: childConfig   // this gets assigned by attachChildConfig
        };
        expect(parentConfig).toEqual(expectedParentConfig);
        expect(childBuilder.getConfig()).toEqual(childConfig);
    });
});

describe('WhenToEnableChildBuilder', () => {
    test('WhenToEnableChildBuilder expects to update parents config assigning whenToEnableConfig', () => {
        let parentBuilder = new TestParentBuilder();
        parentBuilder.childConfig = {
            conditionType: ConditionType.When
        };
        let childBuilder = new WhenToEnableBuilder(parentBuilder);
        let childConfig: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null
        };
        childBuilder.attachChildConfig(childConfig);
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.When,
            whenToEnableConfig: childConfig   // this gets assigned by attachChildConfig
        };
        expect(parentConfig).toEqual(expectedParentConfig);
        expect(childBuilder.getConfig()).toEqual(childConfig);
    });

    test('WhenToEnableChildBuilder expects to update parents config assigning whenToEnableConfig, even if the parent is not a WhenConditionConfig', () => {
        let parentBuilder = new TestParentBuilder();
        parentBuilder.childConfig = {
            conditionType: ConditionType.NotNull
        };
        let childBuilder = new WhenToEnableBuilder(parentBuilder);
        let childConfig: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null
        };
        childBuilder.attachChildConfig(childConfig);
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.NotNull,   // this has not changed
            whenToEnableConfig: childConfig   // this gets assigned by attachChildConfig
        };
        expect(parentConfig).toEqual(expectedParentConfig);
        expect(childBuilder.getConfig()).toEqual(childConfig);
    });
});

describe('ThenChildBuilder', () => {
    test('ThenChildBuilder expects to update parents config assigning thenConfig', () => {
        let parentBuilder = new TestParentBuilder();
        parentBuilder.childConfig = {
            conditionType: ConditionType.When
        };
        let childBuilder = new ThenBuilder(parentBuilder);
        let childConfig: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null
        };
        childBuilder.attachChildConfig(childConfig);
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.When,
            thenConfig: childConfig   // this gets assigned by attachChildConfig
        };
        expect(parentConfig).toEqual(expectedParentConfig);
        expect(childBuilder.getConfig()).toEqual(childConfig);
    });
    test('ThenChildBuilder expects to update parents config assigning thenConfig, even if the parent is not a WhenConditionConfig', () => {
        let parentBuilder = new TestParentBuilder();
        parentBuilder.childConfig = {
            conditionType: ConditionType.NotNull
        };
        let childBuilder = new ThenBuilder(parentBuilder);
        let childConfig: RequireTextConditionConfig = {
            conditionType: ConditionType.RequireText,
            valueHostName: null
        };
        childBuilder.attachChildConfig(childConfig);
        let parentConfig = parentBuilder.getConfig();
        const expectedParentConfig = {
            conditionType: ConditionType.NotNull,   // this has not changed
            thenConfig: childConfig   // this gets assigned by attachChildConfig
        };
        expect(parentConfig).toEqual(expectedParentConfig);
        expect(childBuilder.getConfig()).toEqual(childConfig);
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
        test('causes attachChildConfig to leave the childConfig.valueHostName property unassigned', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new Publicify_StartConditionBuilder(parentBuilder);
            let conditionBuilder = startBuilder.parentValue();
            let childConfig = {
                conditionType: ConditionType.RequireText
            };
            conditionBuilder.attachChildConfig(childConfig);
            let parentConfig = parentBuilder.getConfig();
            const expectedParentConfig = {
                conditionType: ConditionType.RequireText
            };
            expect(parentConfig).toEqual(expectedParentConfig);
            expect((parentConfig as any).valueHostName).toBeUndefined();
            expect(startBuilder.getConfig()).toEqual(expectedParentConfig);
        });
        // same but valueHostName is null in child
        test('causes attachChildConfig to leave the childConfig.valueHostName property unassigned, even if it is null', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new Publicify_StartConditionBuilder(parentBuilder);
            let conditionBuilder = startBuilder.parentValue();
            let childConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: null
            };
            conditionBuilder.attachChildConfig(childConfig);
            let parentConfig = parentBuilder.getConfig();
            const expectedParentConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: null
            };
            expect(parentConfig).toEqual(expectedParentConfig);
            expect((parentConfig as any).valueHostName).toBeNull();
            expect(startBuilder.getConfig()).toEqual(expectedParentConfig);
        });
    });
    describe('fieldValue()', () => {
        test('returns a new ConditionBuilder with its own valueHostName property assigned to the supplied field name', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new Publicify_StartConditionBuilder(parentBuilder);
            let conditionBuilder = startBuilder.fieldValue('myField');
            expect(conditionBuilder).toBeInstanceOf(ConditionBuilder);
            expect(startBuilder.publicify_ValueHostName).toEqual('myField');
            expect(parentBuilder.getConfig()).toBeUndefined();
        });
        test('causes attachChildConfig to assign the childConfig.valueHostName property to the supplied field name', () => {
            let parentBuilder = new TestParentBuilder();
            let startBuilder = new Publicify_StartConditionBuilder(parentBuilder);
            let conditionBuilder = startBuilder.fieldValue('myField');
            let childConfig = {
                conditionType: ConditionType.RequireText
            };
            conditionBuilder.attachChildConfig(childConfig);
            let parentConfig = parentBuilder.getConfig();
            const expectedParentConfig = {
                conditionType: ConditionType.RequireText,
                valueHostName: 'myField'
            };
            expect(parentConfig).toEqual(expectedParentConfig);
            expect(startBuilder.publicify_ValueHostName).toEqual('myField');
            expect(startBuilder.getConfig()).toEqual(expectedParentConfig);
        });
    });
});