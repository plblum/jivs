import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { FieldValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { IValidationServices } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { ValueHostType } from "@plblum/jivs-engine/build/Interfaces/ValueHostFactory";
import { ValidationManagerConfigBuilder } from "../../src/Builder/ValidationManagerConfigBuilder";
import { IFormConfigAdapter, IValidationManagerConfigBuilder } from "../../src/Interfaces/ManagerConfigBuilder";
import { IAdaptModelRulesToForm, RulesConfigOptions } from "../../src/Interfaces/ModelRules";
import { RulesBase } from "../../src/ModelRules/ModelRules";
import { MockValidationServices } from "../TestSupport/mocks";

class Person
{
    firstName: string = '';
    lastName: string = '';
}
class PersonModelRules extends RulesBase {
    constructor(services: IValidationServices) {
        super(services);
    }
    protected configureRules(builder: IValidationManagerConfigBuilder, options?: RulesConfigOptions): void {
        builder.field('firstName', LookupKey.String).requireText();
        builder.field('lastName', LookupKey.String).requireText();
        if (options?.variantName === 'variant1') {
            builder.field('age', LookupKey.Integer);
        }
    }

    public exposeCacheKey(options?: RulesConfigOptions): string {
        return this.createConfigCacheKey(options);
    }
}

describe('RulesBase subclass for a single Model and no form involvement', () => {

    test('configureRules adds rules for the model', () => {
        let services = new MockValidationServices(true, true);
        let rules = new PersonModelRules(services);
        let config = rules.configure();
        // find 2 propertyValueHostConfigs, each with one validator and the RequiredText condition
        config.valueHostConfigs.forEach(vhc => {
            expect(vhc.valueHostType).toBe(ValueHostType.Field); 
            expect(vhc.name).toMatch(/firstName|lastName/);
            let validators = (<FieldValueHostConfig>vhc).validatorConfigs;
            expect(validators).not.toBeNull();
            expect(validators!.length).toBe(1);
            expect(validators![0].conditionConfig).not.toBeNull();
            expect(validators![0].conditionConfig!.conditionType).toBe(ConditionType.RequireText);
        });
        // check the cachingService to see if the config was cached
        let cachedConfig = services.cachingService.get<ValidationManagerConfigBuilder>(rules.exposeCacheKey());
        expect(cachedConfig).not.toBeNull();
        expect(cachedConfig).toBe(config);
    });
    // variantName = 'variant1'
    test('configureRules uses variantName to create a different config', () => {
        let services = new MockValidationServices(true, true);
        let rules = new PersonModelRules(services);
        let config = rules.configure( { variantName: 'variant1' });
        // check that the second config has the age property
        expect(config.valueHostConfigs.length).toBe(3);
        let ageVhc = config.valueHostConfigs.find(vhc => vhc.name === 'age');
        expect(ageVhc).not.toBeNull();
    });


    describe('caching use cases', () => {
        test('configureRules uses cached config when available', () => {
            let services = new MockValidationServices(true, true);
            let rules = new PersonModelRules(services);
            let config1 = rules.configure();
            let config2 = rules.configure();
            expect(config2).toBe(config1);
        });
        // options.disableCache = true
        test('configureRules does not use cached config when options.disableCache = true', () => {
            let services = new MockValidationServices(true, true);
            let rules = new PersonModelRules(services);
            let config1 = rules.configure({ disableCache: true });
            let config2 = rules.configure({ disableCache: true });
            expect(config2).not.toBe(config1);
            let cachedConfig = services.cachingService.get<ValidationManagerConfigBuilder>(rules.exposeCacheKey());
            expect(cachedConfig).toBeUndefined();
        });
        // options.disableCache = false
        test('configureRules uses cached config when options.disableCache = false', () => {
            let services = new MockValidationServices(true, true);
            let rules = new PersonModelRules(services);
            let config1 = rules.configure();
            let config2 = rules.configure({ disableCache: false });
            expect(config2).toBe(config1);
        });
        // variantName = 'variant1' on second call caches two different configs
        test('configureRules uses variantName to create a different config', () => {
            let services = new MockValidationServices(true, true);
            let rules = new PersonModelRules(services);
            let config1 = rules.configure();
            let config2 = rules.configure({ variantName: 'variant1' });
            expect(config2).not.toBe(config1);
            let cachedConfig = services.cachingService.get<ValidationManagerConfigBuilder>(rules.exposeCacheKey());
            expect(cachedConfig).toBe(config1);
            let cachedConfig2 = services.cachingService.get<ValidationManagerConfigBuilder>(rules.exposeCacheKey({ variantName: 'variant1' }));
            expect(cachedConfig2).toBe(config2);

        });

    });

});

describe('RulesBase subclass for a single Model and a Form that adapts the Model rules', () => {
    class PersonEditFormRules extends PersonModelRules implements IAdaptModelRulesToForm {
        constructor(services: IValidationServices) {
            super(services);
        }
        adaptToForm(adapter: IFormConfigAdapter, options?: RulesConfigOptions): void {
            // add form-specific rules and adjustments such as to labels and error messages here
            // note that PropertyValueHosts from the Model class have been converted 
            // to FieldValueHosts prior to calling this due to builder.startUILayerConfig().
            adapter.field('firstName', { label: 'First Name' });
            adapter.field('lastName', { label: 'Last Name' });
            if (options?.variantName === 'variant1') {
                adapter.field('age', { label: 'Age' });
            }
        }
    }
    // same tests as above, but using the FormRules subclass instead of the ModelRules subclass
    test('configureRules adds rules for the model and form', () => {
        let services = new MockValidationServices(true, true);
        let rules = new PersonEditFormRules(services);
        let config = rules.configure();
        // find 2 fieldValueHostConfigs, each with one validator and the RequiredText condition
        config.valueHostConfigs.forEach(vhc => {
            expect(vhc.valueHostType).toBe(ValueHostType.Field); 
            expect(vhc.name).toMatch(/firstName|lastName/);
            expect(vhc.label).toMatch(/First Name|Last Name/);
            let validators = (<FieldValueHostConfig>vhc).validatorConfigs;
            expect(validators).not.toBeNull();
            expect(validators!.length).toBe(1);
            expect(validators![0].conditionConfig).not.toBeNull();
            expect(validators![0].conditionConfig!.conditionType).toBe(ConditionType.RequireText);
        });
        // check the cachingService to see if the config was cached
        let cachedConfig = services.cachingService.get<ValidationManagerConfigBuilder>(rules.exposeCacheKey());
        expect(cachedConfig).not.toBeNull();
        expect(cachedConfig).toBe(config);
    });

    // variantName = 'variant1'
    test('configureRules uses variantName to create a different config', () => {
        let services = new MockValidationServices(true, true);
        let rules = new PersonEditFormRules(services);
        let config = rules.configure({ variantName: 'variant1' });
        // check that the second config has the age property
        expect(config.valueHostConfigs.length).toBe(3);
        let ageVhc = config.valueHostConfigs.find(vhc => vhc.name === 'age');
        expect(ageVhc).not.toBeNull();
        expect(ageVhc!.label).toBe('Age');
    });

    // caching tests are the same as above, so not repeated here
});

