import { FieldValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { ConditionBuilder } from '../../src/Builder/ConditionBuilder';
import { ValueHostsManagerConfigBuilder } from "../../src/Builder/ValueHostsManagerConfigBuilder";
import { ValidatorBuilder } from "../../src/Builder/ValidatorBuilder";
import { CompleteConfigBuilderHandler, IBuilderConfigHost } from '../../src/Interfaces/ChildBuilders';
import { BuildersFactory } from "../../src/Services/BuildersFactory";
import { createJivsServicesForTesting } from '@plblum/jivs-engine/build/Support/createJivsServicesForTesting';



class SubstituteManagerConfigBuilder extends ValueHostsManagerConfigBuilder
{
    constructor(services: IJivsServices) {
        super(services);
    }
}

class SubstituteValidatorBuilder extends ValidatorBuilder
{
    constructor(services: IJivsServices, parentConfig: FieldValueHostConfig) {
        super(services, parentConfig);
    }
}

class SubstituteConditionBuilder extends ConditionBuilder
{
    constructor(services: IJivsServices, parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) {
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
        buildersFactory.services = createJivsServicesForTesting();
        const builder = buildersFactory.createManagerConfigBuilder(null);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(ValueHostsManagerConfigBuilder);
    });

   test('createValidatorBuilder should return a valid builder', () => {
       const buildersFactory = new BuildersFactory();
       buildersFactory.services = createJivsServicesForTesting();
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
        buildersFactory.services = createJivsServicesForTesting();
        const parentBuilder = new TestParentBuilder();
        const builder = buildersFactory.createConditionBuilder(parentBuilder);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(ConditionBuilder);
    });

    test('Replace ManagerConfigBuilder with SubstituteManagerConfigBuilder', () => {
        const buildersFactory = new BuildersFactory();
        buildersFactory.services = createJivsServicesForTesting();  
        buildersFactory.setManagerConfigBuilder(
            (services) => new SubstituteManagerConfigBuilder(buildersFactory.services));
        const builder = buildersFactory.createManagerConfigBuilder(null);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(SubstituteManagerConfigBuilder);
    });

    test('Replace ValidatorBuilder with SubstituteValidatorBuilder', () => {   
        let services = createJivsServicesForTesting();
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
        buildersFactory.services = createJivsServicesForTesting();

        buildersFactory.setConditionBuilderCreator(
            (parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) =>
                new SubstituteConditionBuilder(buildersFactory.services, parentBuilder, completed));
        const parentBuilder = new TestParentBuilder();
        const builder = buildersFactory.createConditionBuilder(parentBuilder);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(SubstituteConditionBuilder);
    });
});