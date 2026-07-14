import { IBuilderConfigHost, CompleteConfigBuilderHandler } from './../../src/Interfaces/ManagerConfigBuilder';
import { ConditionBuilder } from './../../src/Builder/ConditionBuilder_classes';
import { FieldValueHostConfig } from "../../src/Interfaces/FieldValueHost";
import { FluentFactory } from "../../src/Services/FluentFactory";
import { FluentValidatorBuilder } from "../../src/Builder/FluentValidatorBuilder";
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import { MockValidationServices } from '../TestSupport/mocks';


class SubstituteFluentValidatorBuilder extends FluentValidatorBuilder
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

describe('FluentFactory', () => {
   test('createFluentValidatorBuilder should return a valid builder', () => {
       const fluentFactory = new FluentFactory();
       fluentFactory.services = new MockValidationServices(false, false);
       let parentConfig: FieldValueHostConfig = {
           name: 'Field1',
           validatorConfigs: []
       };
       const builder = fluentFactory.createFluentValidatorBuilder(parentConfig);
       expect(builder).toBeDefined();
       expect(builder).toBeInstanceOf(FluentValidatorBuilder);
       expect(builder.parentConfig).toBe(parentConfig);
    });
    
    test('createConditionBuilder should return a valid builder', () => {
        const fluentFactory = new FluentFactory();
        fluentFactory.services = new MockValidationServices(false, false);
        const parentBuilder = new TestParentBuilder();
        const builder = fluentFactory.createConditionBuilder(parentBuilder);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(ConditionBuilder);
    });

    test('Replace FluentValidatorBuilder with SubstituteFluentValidatorBuilder', () => {   
        let services = new MockValidationServices(false, false);
        const fluentFactory = new FluentFactory();
        fluentFactory.services = services;
        fluentFactory.setFluentValidatorBuilderCreator(
            (parentConfig: FieldValueHostConfig) =>
                new SubstituteFluentValidatorBuilder(services, parentConfig));
        let parentConfig: FieldValueHostConfig = {
            name: 'Field1',
            validatorConfigs: []
        };
        const builder = fluentFactory.createFluentValidatorBuilder(parentConfig);
        expect(builder).toBeDefined();
        expect(builder).toBeInstanceOf(SubstituteFluentValidatorBuilder);
        expect(builder.parentConfig).toBe(parentConfig);
    });

    test('Replace ConditionBuilder with SubstituteConditionBuilder', () => {
        const fluentFactory = new FluentFactory();
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