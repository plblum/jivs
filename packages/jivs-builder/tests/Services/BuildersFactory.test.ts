import { FieldValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { ConditionBuilder } from '../../src/Builder/ConditionBuilder';
import { ValidationManagerConfigBuilder } from "../../src/Builder/ValidationManagerConfigBuilder";
import { ValidatorBuilder } from "../../src/Builder/ValidatorBuilder";
import { CompleteConfigBuilderHandler, IBuilderConfigHost } from '../../src/Interfaces/ChildBuilders';
import { BuildersFactory } from "../../src/Services/BuildersFactory";
import { createValidationServicesForTesting } from '@plblum/jivs-engine/build/Support/createValidationServicesForTesting';



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
        const buildersFactory = new BuildersFactory();
        buildersFactory.services = createValidationServicesForTesting();
        const builder = buildersFactory.createManagerConfigBuilder(null);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(ValidationManagerConfigBuilder);
    });

   test('createValidatorBuilder should return a valid builder', () => {
       const buildersFactory = new BuildersFactory();
       buildersFactory.services = createValidationServicesForTesting();
       let parentConfig: FieldValueHostConfig = {
           name: 'Field1',
           validatorConfigs: []
       };
       const builder = buildersFactory.createValidatorBuilder(parentConfig);
       expect(builder).toBeDefined();
       expect(builder).toBeInstanceOf(ValidatorBuilder);
       expect(builder.parentConfig).toBe(parentConfig);
    });
    
    test('createConditionBuilder should return a valid builder', () => {
        const buildersFactory = new BuildersFactory();
        buildersFactory.services = createValidationServicesForTesting();
        const parentBuilder = new TestParentBuilder();
        const builder = buildersFactory.createConditionBuilder(parentBuilder);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(ConditionBuilder);
    });

    test('Replace ManagerConfigBuilder with SubstituteManagerConfigBuilder', () => {
        const buildersFactory = new BuildersFactory();
        buildersFactory.services = createValidationServicesForTesting();  
        buildersFactory.setManagerConfigBuilder(
            (services) => new SubstituteManagerConfigBuilder(buildersFactory.services));
        const builder = buildersFactory.createManagerConfigBuilder(null);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(SubstituteManagerConfigBuilder);
    });

    test('Replace ValidatorBuilder with SubstituteValidatorBuilder', () => {   
        let services = createValidationServicesForTesting();
        const buildersFactory = new BuildersFactory();
        buildersFactory.services = services;
        buildersFactory.setValidatorBuilderCreator(
            (parentConfig: FieldValueHostConfig) =>
                new SubstituteValidatorBuilder(services, parentConfig));
        let parentConfig: FieldValueHostConfig = {
            name: 'Field1',
            validatorConfigs: []
        };
        const builder = buildersFactory.createValidatorBuilder(parentConfig);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(SubstituteValidatorBuilder);
        expect(builder.parentConfig).toBe(parentConfig);
    });

    test('Replace ConditionBuilder with SubstituteConditionBuilder', () => {
        const buildersFactory = new BuildersFactory();
        buildersFactory.services = createValidationServicesForTesting();

        buildersFactory.setConditionBuilderCreator(
            (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
                new SubstituteConditionBuilder(buildersFactory.services, parentBuilder, completed));
        const parentBuilder = new TestParentBuilder();
        const builder = buildersFactory.createConditionBuilder(parentBuilder);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(SubstituteConditionBuilder);
    });
});