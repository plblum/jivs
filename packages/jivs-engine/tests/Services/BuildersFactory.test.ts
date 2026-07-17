import { IBuilderConfigHost, CompleteConfigBuilderHandler } from '../../src/Interfaces/ChildBuilders';
import { ConditionBuilder } from '../../src/Builder/ConditionBuilder';
import { FieldValueHostConfig } from "../../src/Interfaces/FieldValueHost";
import { BuildersFactory } from "../../src/Services/BuildersFactory";
import { ValidatorBuilder } from "../../src/Builder/ValidatorBuilder";
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import { MockValidationServices } from '../TestSupport/mocks';
import { ValidationManagerConfigBuilder } from "../../src/Builder/ValidationManagerConfigBuilder";


class SubstituteManagerConfigBuilder extends ValidationManagerConfigBuilder
{
    constructor(services: IValidationServices) {
        super(services);
    }
}

class SubstituteValidatorBuilder extends ValidatorBuilder
{
    constructor(services: IValidationServices, parentConfig: FieldValueHostConfig) {
        super(services, parentConfig);
    }
}

class SubstituteConditionBuilder extends ConditionBuilder
{
    constructor(services: IValidationServices, parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) {
        super(services, parentBuilder, completed);
    }
}

export class TestParentBuilder implements IBuilderConfigHost<object> {
    /**
     * Constructor
     * @param parentConfig - Config object from the parent to host this validator.
     */
    constructor() {
    }

    private _config?: object;

    public setConfig(config: object, options?: object): IBuilderConfigHost<object> {
        this._config = config;
        return this;
    }
    public getConfig(): object | undefined {
        return this._config;
    }
}

describe('BuildersFactory', () => {
    // createManagerConfigBuilder test
    test('createManagerConfigBuilder should return a valid builder', () => {
        const fluentFactory = new BuildersFactory();
        fluentFactory.services = new MockValidationServices(false, false);
        const builder = fluentFactory.createManagerConfigBuilder(null);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(ValidationManagerConfigBuilder);
    });

   test('createValidatorBuilder should return a valid builder', () => {
       const fluentFactory = new BuildersFactory();
       fluentFactory.services = new MockValidationServices(false, false);
       let parentConfig: FieldValueHostConfig = {
           name: 'Field1',
           validatorConfigs: []
       };
       const builder = fluentFactory.createValidatorBuilder(parentConfig);
       expect(builder).toBeDefined();
       expect(builder).toBeInstanceOf(ValidatorBuilder);
       expect(builder.parentConfig).toBe(parentConfig);
    });
    
    test('createConditionBuilder should return a valid builder', () => {
        const fluentFactory = new BuildersFactory();
        fluentFactory.services = new MockValidationServices(false, false);
        const parentBuilder = new TestParentBuilder();
        const builder = fluentFactory.createConditionBuilder(parentBuilder);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(ConditionBuilder);
    });

    test('Replace ManagerConfigBuilder with SubstituteManagerConfigBuilder', () => {
        const fluentFactory = new BuildersFactory();
        fluentFactory.services = new MockValidationServices(false, false);  
        fluentFactory.setManagerConfigBuilder(
            (services) => new SubstituteManagerConfigBuilder(fluentFactory.services));
        const builder = fluentFactory.createManagerConfigBuilder(null);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(SubstituteManagerConfigBuilder);
    });

    test('Replace ValidatorBuilder with SubstituteValidatorBuilder', () => {   
        let services = new MockValidationServices(false, false);
        const fluentFactory = new BuildersFactory();
        fluentFactory.services = services;
        fluentFactory.setValidatorBuilderCreator(
            (parentConfig: FieldValueHostConfig) =>
                new SubstituteValidatorBuilder(services, parentConfig));
        let parentConfig: FieldValueHostConfig = {
            name: 'Field1',
            validatorConfigs: []
        };
        const builder = fluentFactory.createValidatorBuilder(parentConfig);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(SubstituteValidatorBuilder);
        expect(builder.parentConfig).toBe(parentConfig);
    });

    test('Replace ConditionBuilder with SubstituteConditionBuilder', () => {
        const fluentFactory = new BuildersFactory();
        fluentFactory.services = new MockValidationServices(false, false);

        fluentFactory.setConditionBuilderCreator(
            (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
                new SubstituteConditionBuilder(fluentFactory.services, parentBuilder, completed));
        const parentBuilder = new TestParentBuilder();
        const builder = fluentFactory.createConditionBuilder(parentBuilder);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(SubstituteConditionBuilder);
    });
});