import { BuildersFactoryInstaller } from './../../src/Services/BuildersFactoryInstaller';
import { RequireTextConditionConfig } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { WhenConditionConfig } from '@plblum/jivs-engine/build/Conditions/WhenCondition';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { FieldValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { ValidationSeverity } from '@plblum/jivs-engine/build/Interfaces/Validation';
import { ValueHostsManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { ValidatorConfig } from '@plblum/jivs-engine/build/Interfaces/Validator';
import { ValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { TextLocalizerService } from '@plblum/jivs-engine/build/Services/TextLocalizerService';
import { CapturingLogger } from '@plblum/jivs-engine/build/Support/CapturingLogger';
import { FormConfigAdapter, createFormConfigAdapter } from '../../src/Builder/FormConfigAdapter';
import { BuilderState } from '../../src/Builder/ManagerConfigBuilderBase';
import { createConfigBuilder } from '../../src/Builder/ValueHostsManagerConfigBuilder';
import { ValidatorBuilder } from '../../src/Builder/ValidatorBuilder';
import { AdapterValueHostConfig, BuilderOverrideOptions } from '../../src/Interfaces/ManagerConfigBuilder';
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';
import { ModifyFieldBuilder, ModifyValidatorBuilder } from './../../src/Builder/FormConfigAdapter';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggerService';

// Subclass that makes protected members public for testing
class Publicify_FormConfigAdapter extends FormConfigAdapter
{
    constructor(state: BuilderState<ValueHostsManagerConfig>, options?: BuilderOverrideOptions)
    {
        super(state, options);
    }
    public publicify_destinationValueHostConfigs(): Array<ValueHostConfig> {
        return this.destinationValueHostConfigs();
    }

    public get publicify_baseConfig(): ValueHostsManagerConfig {
        return this.baseConfig;
    }
    public get publicify_overriddenValueHostConfigs(): Array<Array<ValueHostConfig>> {
        return this.overriddenValueHostConfigs;
    }

    public publicify_addOverride(): void {
        this.addOverride();
    }
    protected override favorUIMessages(): void {
        super.favorUIMessages();
        // uninitialized favorUIMessagesCount because this is running from the constructor
        if (this.favorUIMessagesCount === undefined)
            this.favorUIMessagesCount = 0;
        this.favorUIMessagesCount++;
    }

    public publicify_favorUIMessages(): void {
        this.favorUIMessages();
    }
    public declare favorUIMessagesCount?: number;   // favorUIMessages() is called once in constructor, prior to this getting initialized. 'declare' is used to avoid any initialization here.

    public publicify_mergeConfigs(existingConfig: ValueHostConfig, adjustments: AdapterValueHostConfig): void
    {
        this.mergeConfigs(existingConfig, adjustments);
    }
}

function createVMConfig(standardDataTypes?: boolean): ValueHostsManagerConfig {
    let vmConfig: ValueHostsManagerConfig = {
        services: createJivsServicesForTesting(),
        valueHostConfigs: []
    };
    vmConfig.services.loggerService = new CapturingLogger(LoggingLevel.Info, vmConfig.services.loggerService);
    return vmConfig;
}

function setupPublicifyFormAdapter(options?: BuilderOverrideOptions, standardDataTypes?: boolean): Publicify_FormConfigAdapter {
    let state = new BuilderState<ValueHostsManagerConfig>(createVMConfig(standardDataTypes));
    return new Publicify_FormConfigAdapter(state);
}
function setupFallbackService(services: IJivsServices): IJivsServices {
    services.lookupKeyFallbackService.register('NewString', LookupKey.String);
    services.lookupKeyFallbackService.register('NewNumber', LookupKey.Number);
    return services;
}

beforeAll(() => {
    new BuildersFactoryInstaller();  // this will install buildersFactory on JivsServices.prototype
});

describe('constructor', () => {

    test('Basic state', () => {
        let services = createJivsServicesForTesting();
        let state = new BuilderState<ValueHostsManagerConfig>({
            services: services,
            valueHostConfigs: []
        });
        let testItem = new FormConfigAdapter(state);
        expect(testItem.onConfigChanged).toBeNull();
        expect(testItem.notifyValidationStateChangedDelay).toBe(0);
        expect(testItem.capturedState).toBeUndefined();
        expect(testItem.onTextValueChanged).toBeNull();
        expect(testItem.onValueHostValidationStateChanged).toBeNull();
        expect(testItem.onValidationStateChanged).toBeNull();
        expect(testItem.onValueChanged).toBeNull();
        expect(testItem.onValueHostValidationStateChanged).toBeNull();
    });

    // confirm constructor uses favorUIMessages option to set favorUIMessagesCount
    test('favorUIMessages option undefined runs favorUIMessages', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1').requireText();
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());    // no options

        expect(formAdapter.favorUIMessagesCount).toBe(1);
    });
    test('favorUIMessages option true runs favorUIMessages', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1').requireText();
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState(), { favorUIMessages: true });       

        expect(formAdapter.favorUIMessagesCount).toBe(1);
    });
    test('favorUIMessages option false does not run favorUIMessages', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1').requireText();
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState(), { favorUIMessages: false });        
        expect(formAdapter.favorUIMessagesCount).toBeUndefined(); // because favorUIMessage is called in the constructor and the counter doesn't get initiatialized
    });

});
describe('favorUIMessages', () => {
    test('TextLocalizerService has no matches. Keep existing error messages', () => {
        let formAdapter = setupPublicifyFormAdapter();
        let tls = new TextLocalizerService();
        formAdapter.services.textLocalizerService = tls;   // start fresh
        formAdapter.field('Field1').requireText(
            {
                errorMessage: 'RequireMessage',
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n',
            }
        );
        formAdapter.field('Field2').regExp('\\d', true,
            {
                errorMessage: 'RegExpMessage',
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRegExpMessage',
                summaryMessagel10n: 'sml10n'
            }
        ).requireText('Field2Require');
        formAdapter.field('Field3').requireText( // has no error message. Must use eml10n, which will result in ''
            {
                errorMessagel10n: 'eml10n',
                summaryMessagel10n: 'sml10n'
            }
        );
        formAdapter.publicify_favorUIMessages();
        let vmConfig = formAdapter.snapshot();

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'RequireMessage',
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n'
            }]
        },
        {
            valueHostType: ValueHostType.Field,
            name: 'Field2',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RegExp,
                        expressionAsString: '\\d',
                        ignoreCase: true
                    },
                    errorMessage: 'RegExpMessage',
                    errorMessagel10n: 'eml10n',
                    summaryMessage: 'SummaryRegExpMessage',
                    summaryMessagel10n: 'sml10n'
                },
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    },
                    errorMessage: 'Field2Require',
                }]
        },
        {
            valueHostType: ValueHostType.Field,
            name: 'Field3',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    },
                    errorMessagel10n: 'eml10n',
                    summaryMessagel10n: 'sml10n'
                }]
        }
        ]);
    });
    test('TextLocalizerService has matches. Null all 4 message properties on all matches', () => {
        let formAdapter = setupPublicifyFormAdapter();

        let tls = new TextLocalizerService();
        formAdapter.services.textLocalizerService = tls;   // start fresh
        tls.registerErrorMessage(ConditionType.RequireText, null, {
            '*': 'tls-required'
        });
        tls.registerErrorMessage(ConditionType.RegExp, null, {
            '*': 'tls-regexp'
        });
        formAdapter.field('Field1').requireText(
            {
                errorMessage: 'RequireMessage',
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n'
            }
        );
        formAdapter.field('Field2').regExp('\\d', true, 
            {
                errorMessage: 'RegExpMessage',
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRegExpMessage',
                summaryMessagel10n: 'sml10n'
            }).requireText('Field2Require');
        formAdapter.publicify_favorUIMessages();
        let vmConfig = formAdapter.snapshot();

        expect(vmConfig.valueHostConfigs).toEqual([{
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                },
                errorMessage: 'RequireMessage',
                errorMessagel10n: 'eml10n',
                summaryMessage: 'SummaryRequireMessage',
                summaryMessagel10n: 'sml10n',                
            }]
        },
        {
            valueHostType: ValueHostType.Field,
            name: 'Field2',
            validatorConfigs: [
                {
                    conditionConfig: {
                        conditionType: ConditionType.RegExp,
                        expressionAsString: '\\d',
                        ignoreCase: true
                    },
                    errorMessage: 'RegExpMessage',
                    errorMessagel10n: 'eml10n',
                    summaryMessage: 'SummaryRegExpMessage',
                    summaryMessagel10n: 'sml10n',                    
                },
                {
                    conditionConfig: {
                        conditionType: ConditionType.RequireText
                    },
                    errorMessage: 'Field2Require',
                }]
        }
        ]);
    });
});

describe('useOnlyTheseModelFields', () => {
    test('useOnlyTheseModelFields: Add 2 fields, then useOnlyTheseModelFields with 1 of the 2. Only the one is kept', () => {
        let vmConfig = createVMConfig();
        let builder = createConfigBuilder(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.useOnlyTheseModelFields(['Field1']);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled does not exist
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBeUndefined();
        // get field2's config and inspect initialEnabled is false
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBe(false);
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('useOnlyTheseModelFields')).toBe(false);
    });
    // empty array means keep none
    test('useOnlyTheseModelFields: Add 2 fields, then useOnlyTheseModelFields with empty array. None are kept', () => {
        let vmConfig = createVMConfig();
        let builder = createConfigBuilder(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let formAdapter = createFormConfigAdapter(builder);

        formAdapter.useOnlyTheseModelFields([]);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled is false
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBe(false);
        // get field2's config and inspect initialEnabled is false
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBe(false);
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('useOnlyTheseModelFields')).toBe(false);
    });
    // unknown field name is ignored
    test('useOnlyTheseModelFields: Add 2 fields, then useOnlyTheseModelFields with 1 of the 2 and an unknown field. Only the one is kept', () => {
        let vmConfig = createVMConfig();
        let builder = createConfigBuilder(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.useOnlyTheseModelFields(['Field1', 'UnknownField']);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled does not exist
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBeUndefined();
        // get field2's config and inspect initialEnabled is false
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBe(false);
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('useOnlyTheseModelFields')).toBe(true);
        expect(loggerService.containsLog('UnknownField')).toBe(true);
        expect(loggerService.containsLog('Field1')).toBe(false);
    });
});
describe('disableTheseModelFields', () => {
    test('disableTheseModelFields: Add 2 fields, then disableTheseModelFields with 1 of the 2. Only the one is disabled', () => {
        let vmConfig = createVMConfig();
        let builder = createConfigBuilder(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.disableTheseModelFields(['Field1']);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled is false
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBe(false);
        // get field2's config and inspect initialEnabled does not exist
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBeUndefined();
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('disableTheseModelFields')).toBe(false);

    });
    // empty array
    test('disableTheseModelFields: Add 2 fields, then disableTheseModelFields with empty array. None are disabled', () => {
        let vmConfig = createVMConfig();
        let builder = createConfigBuilder(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.disableTheseModelFields([]);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled does not exist
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBeUndefined();
        // get field2's config and inspect initialEnabled does not exist
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBeUndefined();
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('disableTheseModelFields')).toBe(false);
    });
    // unknown field name is ignored
    test('disableTheseModelFields: Add 2 fields, then disableTheseModelFields with 1 of the 2 and an unknown field. Only the one is disabled', () => {
        let vmConfig = createVMConfig();
        let builder = createConfigBuilder(vmConfig);
        builder.field('Field1').requireText();
        builder.field('Field2').requireText();
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.disableTheseModelFields(['Field1', 'UnknownField']);
        let result = builder.snapshot().valueHostConfigs;
        // get field1's config and inspect initialEnabled is false
        let field1Config = result.find((vhc) => vhc.name === 'Field1');
        expect(field1Config).not.toBeUndefined();
        expect(field1Config!.initialEnabled).toBe(false);
        // get field2's config and inspect initialEnabled does not exist
        let field2Config = result.find((vhc) => vhc.name === 'Field2');
        expect(field2Config).not.toBeUndefined();
        expect(field2Config!.initialEnabled).toBeUndefined();
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.containsLog('disableTheseModelFields')).toBe(true);
        expect(loggerService.containsLog('UnknownField')).toBe(true);
        expect(loggerService.containsLog('Field1')).toBe(false);
    });
});

describe('assignToGroup', () => {
    // has 2 existing FieldValueHostConfigs, with no group existing, and assigns both
    test('has 2 existing FieldValueHostConfigs, with no group existing, and assigns both', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs = [
            {
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            },
            {
                valueHostType: ValueHostType.Field,
                name: 'Field2',
            }
        ];
        let builder = createConfigBuilder(vmConfig);
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.assignToGroup('Group1', ['Field1', 'Field2']);
        let result = builder.snapshot().valueHostConfigs;
        let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
        let vh2 = result.find(vhc => vhc.name === 'Field2')! as FieldValueHostConfig;
        expect(vh1.group).toBe('Group1');
        expect(vh2.group).toBe('Group1');
    });
    // one of two gets assigned
    test('one of two gets assigned', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs = [
            {
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            },
            {
                valueHostType: ValueHostType.Field,
                name: 'Field2',
            }
        ];
        let builder = createConfigBuilder(vmConfig);
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.assignToGroup('Group1', ['Field1']);
        let result = builder.snapshot().valueHostConfigs;
        let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
        let vh2 = result.find(vhc => vhc.name === 'Field2')! as FieldValueHostConfig;
        expect(vh1.group).toBe('Group1');
        expect(vh2.group).toBeUndefined();
    });
    // unknown field name is ignored and logged
    test('unknown field name is ignored and logged', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs = [
            {
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            }
        ];
        let builder = createConfigBuilder(vmConfig);
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.assignToGroup('Group1', ['UnknownField']);
        let result = builder.snapshot().valueHostConfigs;
        let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
        expect(vh1.group).toBeUndefined();
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('not already registered')).toBeTruthy();
    });
    // specified name is not a validatable ValueHost. Ignored and logged
    test('specified name is not a validatable ValueHost. Ignored and logged', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs = [
            {
                valueHostType: ValueHostType.Static,
                name: 'Field1'
            }
        ];
        let builder = createConfigBuilder(vmConfig);
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.assignToGroup('Group1', ['Field1']);
        let result = builder.snapshot().valueHostConfigs;
        let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
        expect(vh1.group).toBeUndefined;
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('not a validatable ValueHost')).toBeTruthy();
    });
    // empty array means no assignment, but no error
    test('empty array means no assignment, but no error', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs = [
            {
                valueHostType: ValueHostType.Field,
                name: 'Field1'
            }
        ];
        let builder = createConfigBuilder(vmConfig);
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.assignToGroup('Group1', []);
        let result = builder.snapshot().valueHostConfigs;
        let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
        expect(vh1.group).toBeUndefined();
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('assignToGroup')).toBeFalsy();
    });
    // existing group name is overwritten
    test('existing group name is overwritten', () => {
        let vmConfig = createVMConfig();
        vmConfig.valueHostConfigs = [
            <FieldValueHostConfig>{
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                group: 'Group1'
            }
        ];
        let builder = createConfigBuilder(vmConfig);
        let formAdapter = createFormConfigAdapter(builder);
        formAdapter.assignToGroup('Group2', ['Field1']);
        let result = builder.snapshot().valueHostConfigs;
        let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
        expect(vh1.group).toBe('Group2');
    });
});


describe('mergeConfigs() using publicify_mergeConfigs', () => {

    test('adjustments are all existing in AdapterValueHostConfig. All will end up in the destination, along with those already there. No overwriting in this case.', () => {
        let formAdapter = setupPublicifyFormAdapter();
        let existingConfig: FieldValueHostConfig = {
            // none of these are in the safeReplacementProperties, so they will be retained
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        };
        let adjustments: AdapterValueHostConfig = {
            // only those properties that are in the safeReplacementProperties will be merged into the destination. The rest will be ignored.
            initialEnabled: false,
            label: 'NewLabel',
            labell10n: 'NewLabelL10n',
            enablerConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field2'
            },
            group: 'NewGroup',
            parserLookupKey: 'NewParserLookupKey',
            propertyName: 'NewPropertyName',
            // validatorConfigs is NEVER here
        };
        let expectedValueHostConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }],
            initialEnabled: false,
            label: 'NewLabel',
            labell10n: 'NewLabelL10n',
            enablerConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field2'
            },
            group: 'NewGroup',
            parserLookupKey: 'NewParserLookupKey',
            propertyName: 'NewPropertyName'
        };
        formAdapter.publicify_mergeConfigs(existingConfig, adjustments);
        expect(existingConfig).toEqual(expectedValueHostConfig);
        // logger should have no warnings about skipped properties, because all properties in adjustments are in the safeReplacementProperties
        let loggerService = formAdapter.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('Skipped property')).toBeFalsy();
    });
    // nothing in adjustments. No change to soruce
    test('nothing in adjustments. No change to source', () => {
        let formAdapter = setupPublicifyFormAdapter();
        let existingConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        };
        let adjustments: AdapterValueHostConfig = {
        };
        let expectedValueHostConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        };
        formAdapter.publicify_mergeConfigs(existingConfig, adjustments);
        expect(existingConfig).toEqual(expectedValueHostConfig);
        let loggerService = formAdapter.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('Skipped property')).toBeFalsy();
    });

    test('adjustments has properties that are in doNotReplaceTheseProperties. Those will be ignored.', () => {
        let formAdapter = setupPublicifyFormAdapter();
        let existingConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        };
        let adjustments = {
            dataType: 'ThisShouldBeIgnored',
            validatorConfigs: []
        };
        let expectedValueHostConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        };
        formAdapter.publicify_mergeConfigs(existingConfig, adjustments as any);
        expect(existingConfig).toEqual(expectedValueHostConfig);
        let loggerService = formAdapter.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('Skipped property "dataType"')).toBeTruthy();
        expect(loggerService.findMessage('Skipped property "validatorConfigs"')).toBeTruthy();
    });
    test('original has values matching those in adjustments. all of them covered. replacement supplies all properties in the safeReplacementProperties. All will be replaced with the new values.', () => {
        let formAdapter = setupPublicifyFormAdapter();
        let existingConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }],
            initialEnabled: true,
            label: 'OldLabel',
            labell10n: 'OldLabelL10n',
            enablerConfig: {
                conditionType: ConditionType.DataTypeCheck
            },
            group: 'OldGroup',
            parserLookupKey: 'OldParserLookupKey',
            propertyName: 'OldPropertyName'
        };
        let adjustments: AdapterValueHostConfig = {
            initialEnabled: false,
            label: 'NewLabel',
            labell10n: 'NewLabelL10n',
            enablerConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field2'
            },
            group: 'NewGroup',
            parserLookupKey: 'NewParserLookupKey',
            propertyName: 'NewPropertyName'
        };
        let expectedValueHostConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }],
            initialEnabled: false,
            label: 'NewLabel',
            labell10n: 'NewLabelL10n',
            enablerConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field2'
            },
            group: 'NewGroup',
            parserLookupKey: 'NewParserLookupKey',
            propertyName: 'NewPropertyName'
        };
        formAdapter.publicify_mergeConfigs(existingConfig, adjustments);
        expect(existingConfig).toEqual(expectedValueHostConfig);
        let loggerService = formAdapter.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('Skipped property')).toBeFalsy();

    });
    // adjustments contains a new property that is not in doNotReplaceTheseProperties. It will be added to the existing config
    test('adjustments contains a new property that is not in doNotReplaceTheseProperties. It will be added to the existing config', () => {
        let formAdapter = setupPublicifyFormAdapter();
        let existingConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }]
        };
        let adjustments ={
            newProperty: 'NewPropertyValue'
        };
        let expectedValueHostConfig: FieldValueHostConfig & { newProperty: 'NewPropertyValue' } = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            dataType: LookupKey.String,
            validatorConfigs: [{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            }],
            newProperty: 'NewPropertyValue'
        };
        formAdapter.publicify_mergeConfigs(existingConfig, adjustments as any);
        expect(existingConfig).toEqual(expectedValueHostConfig);
        let loggerService = formAdapter.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('Skipped property')).toBeFalsy();

    });

});
describe('modify()', () => {
    // valuehostname already defined, no second parameter, returns ModifyFieldBuilder with the existing config
    test('valuehostname already defined, no second parameter, returns ModifyFieldBuilder with the existing config', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1');
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        let modifyBuilder = formAdapter.modify('Field1');
        let expectedConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(modifyBuilder).not.toBeNull();
        expect(modifyBuilder!.getConfig()).toEqual(expectedConfig);
    });
    // valuehostname not defined, no second parameter. Throws error and records an entry in the loggerService
    test('valuehostname not defined, no second parameter. Throws error and records an entry in the loggerService', () => {
        let vmConfig = createVMConfig();
        let builder = createConfigBuilder(vmConfig);
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        expect(() => {
            formAdapter.modify('Field2');
        }).toThrow('ValueHost name "Field2" is not defined');
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('ValueHost name "Field2" is not defined')).toBeTruthy();
    });
    // valueHostName is valid, second parameter is null. Returns ModifyFieldBuilder with the existing config
    test('valueHostName is valid, second parameter is null. Returns ModifyFieldBuilder with the existing config', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1');
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        let modifyBuilder = formAdapter.modify('Field1', null!);
        let expectedConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(modifyBuilder).not.toBeNull();
        expect(modifyBuilder!.getConfig()).toEqual(expectedConfig);
    });
    // valueHostName is valid, second parameter is an empty object. Returns ModifyFieldBuilder with the existing config
    test('valueHostName is valid, second parameter is an empty object. Returns ModifyFieldBuilder with the existing config', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1');
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        let modifyBuilder = formAdapter.modify('Field1', {});
        let expectedConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: []
        };
        expect(modifyBuilder).not.toBeNull();
        expect(modifyBuilder!.getConfig()).toEqual(expectedConfig);
    });
    test('valueHostName is valid, second parameter is an object with all properties that are in AdapterValueHostConfig. Returns ModifyFieldBuilder with the existing config, plus the properties from the second parameter', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1');
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        let modifyBuilder = formAdapter.modify('Field1', {
            initialEnabled: false,
            label: 'NewLabel',
            labell10n: 'NewLabelL10n',
            enablerConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field2'
            },
            group: 'NewGroup',
            parserLookupKey: 'NewParserLookupKey',
            propertyName: 'NewPropertyName'
        });
        let expectedConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [],
            initialEnabled: false,
            label: 'NewLabel',
            labell10n: 'NewLabelL10n',
            enablerConfig: <RequireTextConditionConfig>{
                conditionType: ConditionType.RequireText,
                valueHostName: 'Field2'
            },
            group: 'NewGroup',
            parserLookupKey: 'NewParserLookupKey',
            propertyName: 'NewPropertyName'
        };
        expect(modifyBuilder).not.toBeNull();
        expect(modifyBuilder!.getConfig()).toEqual(expectedConfig);
    });
    test('valueHostName is valid, second parameter object has only one property, it is in doNotReplaceTheseProperties. That property is ignored, and the rest are applied to the existing config', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1');
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        let modifyBuilder = formAdapter.modify('Field1', <any>{
            dataType: 'NewDataType'
        });
        let expectedConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [],
        };
        expect(modifyBuilder).not.toBeNull();
        expect(modifyBuilder!.getConfig()).toEqual(expectedConfig);
        let loggerService = formAdapter.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('Skipped property "dataType"')).toBeTruthy();
    });

    test('valueHostName is invalid, second parameter is an empty object. Throws error and records an entry in the loggerService', () => {
        let vmConfig = createVMConfig();
        let builder = createConfigBuilder(vmConfig);
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        expect(() => {
            formAdapter.modify('Field2', {});
        }).toThrow('ValueHost name "Field2" is not defined');
        let loggerService = vmConfig.services.loggerService as CapturingLogger;
        expect(loggerService.findMessage('ValueHost name "Field2" is not defined')).toBeTruthy();
    });

    test('valid valueHostName, second parameter is a label. Returns ModifyFieldBuilder with the existing config, plus the label property from the second parameter', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1');
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        let modifyBuilder = formAdapter.modify('Field1', 'NewLabel');
        let expectedConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [],
            label: 'NewLabel'
        };
        expect(modifyBuilder).not.toBeNull();
        expect(modifyBuilder!.getConfig()).toEqual(expectedConfig);
    });
    
});

describe('ModifyFieldBuilder class', () => {
    describe('validator()', () => {
        // single parameter overload with an existing conditionType. Returns a ModifyValidatorBuilder correctly configured.
        test('single parameter overload with an existing conditionType. Returns a ModifyValidatorBuilder correctly configured.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText);
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // same but require text has an errorcode
        test('single parameter overload with an existing conditionType that has an errorCode. Returns a ModifyValidatorBuilder correctly configured.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText({ errorCode: 'ErrorCode1' });
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator('ErrorCode1');
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorCode: 'ErrorCode1',
                conditionConfig: {
                    conditionType: ConditionType.RequireText,
                }
            });
        });
        // two parameter overload with an existing conditionType, second parameter is null. Returns a ModifyValidatorBuilder correctly configured without changes.
        test('two parameter overload with an existing conditionType, second parameter is null. Returns a ModifyValidatorBuilder correctly configured without changes.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, null!);
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // second parameter is an empty object. Returns a ModifyValidatorBuilder correctly configured without changes.
        test('two parameter overload with an existing conditionType, second parameter is an empty object. Returns a ModifyValidatorBuilder correctly configured without changes.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, {});
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // second parameter is an object with all properties that are in ValidatorConfig. Returns a ModifyValidatorBuilder correctly configured with the properties from the second parameter.
        test('two parameter overload with an existing conditionType, second parameter is an object with all properties that are in ValidatorConfig. Returns a ModifyValidatorBuilder correctly configured with the properties from the second parameter.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, {
                errorCode: 'ErrorCode1',
                errorMessage: 'ErrorMessage1',
                errorMessagel10n: 'ErrorMessageL10n1',
                summaryMessage: 'SummaryMessage1',
                summaryMessagel10n: 'SummaryMessageL10n1',
                severity: ValidationSeverity.Error,
            });
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorCode: 'ErrorCode1',
                errorMessage: 'ErrorMessage1',
                errorMessagel10n: 'ErrorMessageL10n1',
                summaryMessage: 'SummaryMessage1',
                summaryMessagel10n: 'SummaryMessageL10n1',
                severity: ValidationSeverity.Error,
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // second parameter is an object with one property that is in doNotReplaceTheseProperties. That property is ignored, and the rest are applied to the existing config
        test('second parameter is an object with all properties in doNotReplaceTheseProperties and one valid. Invalid properties are ignored and logged', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, <any>{
                errorMessage: 'ErrorMessage1', // valid
                conditionCreator: (value: any) => { return value; }, // not allowed
                conditionConfig: { // not allowed
                    conditionType: ConditionType.DataTypeCheck
                }
            });
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorMessage: 'ErrorMessage1',
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
            let loggerService = formAdapter.services.loggerService as CapturingLogger;
            expect(loggerService.findMessage('Skipped property "conditionConfig"')).toBeTruthy();
            expect(loggerService.findMessage('Skipped property "conditionCreator"')).toBeTruthy();
        });
        // 2 parameter, conditionType and error message
        test('two parameter overload with an existing conditionType, second parameter is an error message. Returns a ModifyValidatorBuilder correctly configured with the error message from the second parameter.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, 'ErrorMessage1');
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorMessage: 'ErrorMessage1',
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // 3 parameter, conditionType, error message, and summary message
        test('three parameter overload with an existing conditionType, second parameter is an error message, third parameter is a summary message. Returns a ModifyValidatorBuilder correctly configured with the error message and summary message from the second and third parameters.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, 'ErrorMessage1', 'SummaryMessage1');
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorMessage: 'ErrorMessage1',
                summaryMessage: 'SummaryMessage1',
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // 3 parameter, conditionType, null, summary message
        test('three parameter overload with an existing conditionType, second parameter is null, third parameter is a summary message. Returns a ModifyValidatorBuilder correctly configured with the summary message from the third parameter.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, null, 'SummaryMessage1');
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorMessage: null,
                summaryMessage: 'SummaryMessage1',
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // 2 parameter, conditionType, empty string (for error message)
        test('two parameter overload with an existing conditionType, second parameter is an empty string. Returns a ModifyValidatorBuilder correctly configured with the empty string as the error message.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, '');
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorMessage: '',
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // 3 parameter, conditionType, empty string, empty string
        test('three parameter overload with an existing conditionType, second parameter is an empty string, third parameter is an empty string. Returns a ModifyValidatorBuilder correctly configured with the empty strings as the error message and summary message.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, '', '');
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorMessage: '',
                summaryMessage: '',
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // 3 parameter, empty string, null
        test('three parameter overload with an existing conditionType, second parameter is an empty string, third parameter is null. Returns a ModifyValidatorBuilder correctly configured with the empty string as the error message and summary message = null.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, '', null);
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorMessage: '',
                summaryMessage: null,
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
        // 3 parameter, null, empty string
        test('three parameter overload with an existing conditionType, second parameter is null, third parameter is an empty string. Returns a ModifyValidatorBuilder correctly configured with no error message and the empty string as the summary message.', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();  
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.validator(ConditionType.RequireText, null, '');
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorMessage: null,
                summaryMessage: '',
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
        });
    });

    describe('addValidator()', () => {
        // used on a field, which supports a validator, and has no validators, returns a IValidatorBuilder correctly configured with the new validator
        test('used on a field, which supports a validator, and has no validators, returns a IValidatorBuilder correctly configured with the new validator', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let result = modifyBuilder.addValidator();
            expect(result).toBeInstanceOf(ValidatorBuilder);
            expect(result.parentConfig).toEqual(<FieldValueHostConfig>{
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: []
            });
        });
        // valuehost is static, which does not support a validator. Throws error and records an entry in the loggerService
        test('valuehost is static, which does not support a validator. Throws error and records an entry in the loggerService', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.static('Static1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Static1');
            expect(() => {
                modifyBuilder.addValidator();
            }).toThrow('ValueHost type');
            let loggerService = formAdapter.services.loggerService as CapturingLogger;
            expect(loggerService.findMessage('does not support validators')).toBeTruthy();
        });
        // add a validator after modify() and check results
        test('add a validator after modify() and check results', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1');    
            let formAdapter = new Publicify_FormConfigAdapter(
                    builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');   
            modifyBuilder.addValidator().requireText('errormessage1');
            let result = builder.snapshot().valueHostConfigs;
            let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
            let expectedConfig: FieldValueHostConfig = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: [{    
                    errorMessage: 'errormessage1',
                    conditionConfig: {
                            conditionType: ConditionType.RequireText
                        }
                }]
            };
            expect(vh1).toEqual(expectedConfig);
        });
        // add two validators after modify() and check results
        test('add two validators chained after modify() and check results', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            modifyBuilder.addValidator()
                .requireText('errormessage1')
                .dataTypeCheck('errormessage2');
            let result = builder.snapshot().valueHostConfigs;
            let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
            let expectedConfig: FieldValueHostConfig = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: [
                    {
                        errorMessage: 'errormessage1',
                        conditionConfig: {
                            conditionType: ConditionType.RequireText
                        }
                    },
                    {
                        errorMessage: 'errormessage2',
                        conditionConfig: {
                            conditionType: ConditionType.DataTypeCheck,
                        }   
                    }
                ]
            };
            expect(vh1).toEqual(expectedConfig);
        });
        // same but each validator is a separate use of modify().addValidator()
        test('add two validators, each a separate use of modify().addValidator() and check results', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            modifyBuilder.addValidator().requireText('errormessage1');
            modifyBuilder.addValidator().dataTypeCheck('errormessage2');
            let result = builder.snapshot().valueHostConfigs;
            let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
            let expectedConfig: FieldValueHostConfig = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: [
                    {
                        errorMessage: 'errormessage1',
                        conditionConfig: {
                            conditionType: ConditionType.RequireText
                        }
                    },
                    {
                        errorMessage: 'errormessage2',
                        conditionConfig: {
                            conditionType: ConditionType.DataTypeCheck,
                        }
                    }
                ]
            };
            expect(vh1).toEqual(expectedConfig);
        });
        // the same validator already exists on the initial field(), reports an error and logs a message, but does not add a duplicate validator
        test('the same validator already exists on the initial field(), throws and logs a message, but does not add a duplicate validator', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText('errormessage1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');   
            expect(() => {
                modifyBuilder.addValidator().requireText('errormessage1');
            }).toThrow(/with errorCode/);
            let loggerService = formAdapter.services.loggerService as CapturingLogger;
            loggerService.toConsole();
            expect(loggerService.findMessage('with errorCode')).toBeTruthy();
        });
        // same validator but supply {errorCode: 'ErrorCode1'} in the second parameter. It is added as a new validator, because the errorCode is different from the existing one
        test('same validator but supply {errorCode: "ErrorCode1"} in the second parameter. It is added as a new validator, because the errorCode is different from the existing one', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText('errormessage1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            modifyBuilder.addValidator().requireText({ errorCode: 'ErrorCode1' });
            let result = builder.snapshot().valueHostConfigs;
            let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
            let expectedConfig: FieldValueHostConfig = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: [
                    {
                        errorMessage: 'errormessage1',
                        conditionConfig: {
                            conditionType: ConditionType.RequireText
                        }
                    },
                    {
                        errorCode: 'ErrorCode1',
                        conditionConfig: {
                            conditionType: ConditionType.RequireText
                        }
                    }
                ]
            };
            expect(vh1).toEqual(expectedConfig);
        });
    });

    describe('whenToEnable', () => {
        test('With a known valueHostName, returns the same instance', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let result = formAdapter.modify('Field1').whenToEnable((childBuilder) => childBuilder);
            expect(result).toBeInstanceOf(ModifyFieldBuilder);
        });

        test('using parentValue().requireText(), updates enablerConfig', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            formAdapter.modify('Field1').whenToEnable(childBuilder => childBuilder.parentValue().requireText());
            let result = builder.snapshot().valueHostConfigs;
            let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
            let expectedConfig: FieldValueHostConfig = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: [],
                enablerConfig: {
                    conditionType: ConditionType.RequireText
                }
            };
            expect(vh1).toEqual(expectedConfig);
        });
        test('child using fieldValue().requireText(), updates enablerConfig', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            formAdapter.modify('Field1').whenToEnable(childBuilder => childBuilder.fieldValue('Field2').requireText());
            let result = builder.snapshot().valueHostConfigs;
            let vh1 = result.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
            let expectedConfig = {
                valueHostType: ValueHostType.Field,
                name: 'Field1',
                validatorConfigs: [],
                enablerConfig: {
                    conditionType: ConditionType.RequireText,
                    valueHostName: 'Field2'
                }
            };
            expect(vh1).toEqual(expectedConfig);
        });
    });
    describe('refineDataType', () => {
        test('New data type that is registered with the service. The data type is replaced', () => {
            let builder = createConfigBuilder(createVMConfig());
            setupFallbackService(builder.services);
            builder.field('Field1', LookupKey.String);
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            formAdapter.modify('Field1').refineDataType('NewString');
            let fieldConfig = builder.snapshot().valueHostConfigs.find(vhc => vhc.name === 'Field1')!;
            expect(fieldConfig.dataType).toBe('NewString');
        });
        test('Unknown data type throws when ValueHostConfig.dataType is already assigned', () => {
            let builder = createConfigBuilder(createVMConfig());
            setupFallbackService(builder.services);
            builder.field('Field1', LookupKey.String);
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());

            // using a FieldValueHostConfig definition to test replaceDataType, which is normally used for ValueHostConfigs that are not FieldValueHostConfigs
            expect(() => {
                formAdapter.modify('Field1').refineDataType('NewUnknownDataType');
            }).toThrow('Cannot replace dataType');

        });

        // known data type requested, but the ValueHostConfig.dataType is not assigned. Replaces with the known data type.
        test('Known data type requested, but the ValueHostConfig.dataType is not assigned. Replaces with the known data type.', () => {
            let builder = createConfigBuilder(createVMConfig());
            setupFallbackService(builder.services);
            builder.field('Field1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());

            formAdapter.modify('Field1').refineDataType('NewString');
            let fieldConfig = builder.snapshot().valueHostConfigs.find(vhc => vhc.name === 'Field1')!;
            expect(fieldConfig.dataType).toBe('NewString');
        });

        // unknown data type requested, and the ValueHostConfig.dataType is not assigned. Still assigns it
        test('Unknown data type requested, and the ValueHostConfig.dataType is not assigned. Still assigns it', () => {
            let builder = createConfigBuilder(createVMConfig());
            setupFallbackService(builder.services);
            builder.field('Field1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());

            formAdapter.modify('Field1').refineDataType('NewUnknownDataType');
            let fieldConfig = builder.snapshot().valueHostConfigs.find(vhc => vhc.name === 'Field1')!;
            expect(fieldConfig.dataType).toBe('NewUnknownDataType');
        });
        test('Source is String. Existing data type is String. No change to data type', () => {
            let builder = createConfigBuilder(createVMConfig());
            setupFallbackService(builder.services);
            builder.field('Field1', LookupKey.String);
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());

            formAdapter.modify('Field1').refineDataType(LookupKey.String);
            let fieldConfig = builder.snapshot().valueHostConfigs.find(vhc => vhc.name === 'Field1')!;
            expect(fieldConfig.dataType).toBe(LookupKey.String);
        });
        // source is string, Existing data type is unassigned. Replaces with string
        test('Source is String. Existing data type is unassigned. Replaces with String', () => {
            let builder = createConfigBuilder(createVMConfig());
            setupFallbackService(builder.services);
            builder.field('Field1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            
            formAdapter.modify('Field1').refineDataType(LookupKey.String);
            let fieldConfig = builder.snapshot().valueHostConfigs.find(vhc => vhc.name === 'Field1')!;
            expect(fieldConfig.dataType).toBe(LookupKey.String);
        });
        // Both valid but not a valid fallback. Throws error
        test('Both valid but not a valid fallback. Throws error', () => {
            let builder = createConfigBuilder(createVMConfig());
            setupFallbackService(builder.services);
            builder.field('Field1', LookupKey.String);
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());

            expect(() => { // string is not a valid fallback for number
                formAdapter.modify('Field1').refineDataType(LookupKey.Number);
            }).toThrow('Cannot replace dataType');
        });
    });    
});
describe('ModifyValidatorBuilder class', () => {
    describe('constructor', () => {
        test('constructor with existingValidator, returns a ModifyValidatorBuilder correctly configured', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText({ errorCode: 'ErrorCode1' });
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            expect(result).toBeInstanceOf(ModifyValidatorBuilder);
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorCode: 'ErrorCode1',
                conditionConfig: {
                    conditionType: ConditionType.RequireText
                }
            });
            
        });
        // existingValidator is null, throws
        test('existingValidator is null, throws', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText({ errorCode: 'ErrorCode1' });
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            expect(() => {
                new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, null!);
            }).toThrow(/existingValidator/);
        })
    });
    describe('and()', () => {
        // these tests expect to combine an existing validator's condition with another
        // by replacing the validator with AndMatchesCondition for existing AND new.
        test('existing validator is RequireText, add AndMatchesCondition with a new condition. Returns a ModifyValidatorBuilder correctly configured', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            result.and((childBuilder) =>
                childBuilder.parentValue().dataTypeCheck());
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorCode: ConditionType.RequireText,   // inherited from original validator
                conditionConfig: {
                    conditionType: ConditionType.All,
                    conditionConfigs: [
                        {
                            conditionType: ConditionType.RequireText
                        },
                        {
                            conditionType: ConditionType.DataTypeCheck
                        }
                    ]
                }
            });
        });
        test('second parameter is null.throws', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            expect(() => {
                result.and(null!);
            }).toThrow(/Function expected/);
        });
        test('second parameter does not modify the builder, so it does not create the new condition. Throws', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            expect(() => {
                result.and((childBuilder) => childBuilder);
            }).toThrow(/Child builder/);
        });        
        // special case: validatorConfig.conditionConfig = null throws
        test('special case: validatorConfig.conditionConfig = null throws', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            existingValidator.conditionConfig = null!;
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            expect(() => {
                result.and((childBuilder) =>
                    childBuilder.parentValue().dataTypeCheck());
            }).toThrow(/condition is null/);
        });
        // field already has AndMatchesCondition. New condition is added to the existing AndMatchesCondition.conditions array
        test('field already has AndMatchesCondition. New condition is added to the existing AndMatchesCondition.conditions array', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').all((childBuilder) =>
                childBuilder.parentValue().requireText(),
                'error message1',
                'summary message1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            result.and((childBuilder) =>
                childBuilder.parentValue().dataTypeCheck());
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorCode: ConditionType.All,   // inherited from original validator
                errorMessage: 'error message1', // does not get lost
                summaryMessage: 'summary message1', // does not get lost
                conditionConfig: {
                    conditionType: ConditionType.All,
                    conditionConfigs: [
                        {
                            conditionType: ConditionType.RequireText
                        },
                        {
                            conditionType: ConditionType.DataTypeCheck
                        }
                    ]
                }
            });
        });
        // same as last, except the original RequiredText has an errorCode.
        test('same as last, except the original RequireText has an errorCode which is inherited', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').all((childBuilder) =>
                childBuilder.parentValue().requireText(),
                {
                    errorCode: 'ErrorCode1',
                    errorMessage: 'error message1',
                    summaryMessage: 'summary message1'
                 });
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            result.and((childBuilder) =>
                childBuilder.parentValue().dataTypeCheck());

            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorCode: 'ErrorCode1', // inherited from original validator
                errorMessage: 'error message1', // does not get lost
                summaryMessage: 'summary message1', // does not get lost
                conditionConfig: {
                    conditionType: ConditionType.All,
                    conditionConfigs: [
                        {
                            conditionType: ConditionType.All,
                            conditionConfigs: [
                                {
                                    conditionType: ConditionType.RequireText
                                }
                            ]
                        },
                        {
                            conditionType: ConditionType.DataTypeCheck
                        }
                    ]
                }
            });
        });
    });
    describe('or()', () => {
        // these tests expect to combine an existing validator's condition with another
        // by replacing the validator with AndMatchesCondition for existing AND new.
        test('existing validator is RequireText, add AndMatchesCondition with a new condition. Returns a ModifyValidatorBuilder correctly configured', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            result.or((childBuilder) =>
                childBuilder.parentValue().dataTypeCheck());
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorCode: ConditionType.RequireText,   // inherited from original validator
                conditionConfig: {
                    conditionType: ConditionType.Any,
                    conditionConfigs: [
                        {
                            conditionType: ConditionType.RequireText
                        },
                        {
                            conditionType: ConditionType.DataTypeCheck
                        }
                    ]
                }
            });
        });
        test('second parameter is null.throws', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            expect(() => {
                result.or(null!);
            }).toThrow(/Function expected/);
        });
        // second parameter does not modify the builder, so it does not create the new condition. Throws
        test('second parameter does not modify the builder, so it does not create the new condition. Throws', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            expect(() => {
                result.or((childBuilder) => childBuilder);
            }).toThrow(/Child builder/);
        });
        // special case: validatorConfig.conditionConfig = null throws
        test('special case: validatorConfig.conditionConfig = null throws', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').requireText();
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            existingValidator.conditionConfig = null!;
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            expect(() => {
                result.or((childBuilder) =>
                    childBuilder.parentValue().dataTypeCheck());
            }).toThrow(/condition is null/);
        });
        // field already has AndMatchesCondition. New condition is added to the existing AndMatchesCondition.conditions array
        test('field already has AndMatchesCondition. New condition is added to the existing AndMatchesCondition.conditions array', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').any((childBuilder) =>
                childBuilder.parentValue().requireText(),
                'error message1',
                'summary message1');
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            result.or((childBuilder) =>
                childBuilder.parentValue().dataTypeCheck());
            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorCode: ConditionType.Any,   // inherited from original validator
                errorMessage: 'error message1', // does not get lost
                summaryMessage: 'summary message1', // does not get lost
                conditionConfig: {
                    conditionType: ConditionType.Any,
                    conditionConfigs: [
                        {
                            conditionType: ConditionType.RequireText
                        },
                        {
                            conditionType: ConditionType.DataTypeCheck
                        }
                    ]
                }
            });
        });
        test('same as last, except the original Validator has an errorCode which gets inheritd', () => {
            let builder = createConfigBuilder(createVMConfig());
            builder.field('Field1').any((childBuilder) =>
                childBuilder.parentValue().requireText(),
                {
                    errorCode: 'ErrorCode1',
                    errorMessage: 'error message1',
                    summaryMessage: 'summary message1'
                 });
            let formAdapter = new Publicify_FormConfigAdapter(
                builder.handOffState());
            let modifyBuilder = formAdapter.modify('Field1');
            let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
            let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
            result.or((childBuilder) =>
                childBuilder.parentValue().dataTypeCheck());

            expect(result.getConfig()).toEqual(<ValidatorConfig>{
                errorCode: 'ErrorCode1', // inherited from original validator
                errorMessage: 'error message1', // does not get lost
                summaryMessage: 'summary message1', // does not get lost
                conditionConfig: {
                    conditionType: ConditionType.Any,
                    conditionConfigs: [
                        {
                            conditionType: ConditionType.Any,
                            conditionConfigs: [
                                {
                                    conditionType: ConditionType.RequireText
                                }
                            ]
                        },
                        {
                            conditionType: ConditionType.DataTypeCheck
                        }
                    ]
                }
            });
        });
    });    
});

describe('whenToEnable()', () => {
    test('with a known valueHostName, creates the WhenCondition with existing as the Then and the new one as the When', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1').requireText();
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        let modifyBuilder = formAdapter.modify('Field1');
        let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
        let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
        result.whenToEnable((childBuilder) => childBuilder.parentValue().equalTo(10));
        let vh1 = builder.snapshot().valueHostConfigs.find(vhc => vhc.name === 'Field1')! as FieldValueHostConfig;
        let expectedConfig: FieldValueHostConfig = {
            valueHostType: ValueHostType.Field,
            name: 'Field1',
            validatorConfigs: [
                {
                    conditionConfig: <WhenConditionConfig>{
                        conditionType: ConditionType.When,
                        whenToEnableConfig: {
                            conditionType: ConditionType.EqualTo,
                            secondValue: 10
                        },
                        thenConfig: {
                            conditionType: ConditionType.RequireText
                        }
                    }
                }
            ]
        };
        expect(vh1).toEqual(expectedConfig);
    });
    // existing validator has conditionConfig = null, throws. Special case
    test('existing validator has conditionConfig = null, throws. Special case', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1').requireText();
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        let modifyBuilder = formAdapter.modify('Field1');
        let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
        existingValidator.conditionConfig = null!;
        let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
        expect(() => {
            result.whenToEnable((childBuilder) => childBuilder.parentValue().equalTo(10));
        }).toThrow(/condition is null/);
    });
    // second parameter does not take any action, meaning it has no child condition for the When. Throws
    test('second parameter does not take any action, meaning it has no child condition for the When. Throws', () => {
        let builder = createConfigBuilder(createVMConfig());
        builder.field('Field1').requireText();
        let formAdapter = new Publicify_FormConfigAdapter(
            builder.handOffState());
        let modifyBuilder = formAdapter.modify('Field1');
        let existingValidator = (<FieldValueHostConfig>modifyBuilder.getConfig()).validatorConfigs![0];
        let result = new ModifyValidatorBuilder(formAdapter.services, modifyBuilder as any, existingValidator);
        expect(() => {
            result.whenToEnable((childBuilder) => childBuilder);
        }).toThrow(/Child builder/);
    });
});