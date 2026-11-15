/**
 * Factory class to create instances of IValidator based on ValidatorConfig.
 * @module jivs-engine/Validation/ConcreteClasses/ValidatorFactory
 */

import { AsyncValidatorConfig } from '../Interfaces/AsyncValidator';
import
    {
        IValidator, IValidatorFactory, ValidatorConfig,
        ValidatorConfigBase, ValidatorCreatorHandler, ValidatorType
    } from '../Interfaces/Validator';
import { IValidatorsValueHost } from '../Interfaces/ValidatorsValueHostBase';
import { CodingError } from '../Utilities/ErrorHandling';
import { AsyncValidator } from './AsyncValidator';
import { Validator } from './Validator';

/**
 * ValidatorFactory creates the appropriate IValidator class.
 * It supports the built-in Validator class when ValidatorConfig.validatorType=null/undefined.
 */
export class ValidatorFactory implements IValidatorFactory
{
    constructor()
    {
        // preregister
        this.register(ValidatorType.Validator, (valueHost: IValidatorsValueHost, config: ValidatorConfigBase) =>
            new Validator(valueHost, config as ValidatorConfig));
        this.register(ValidatorType.AsyncValidator,
            (valueHost: IValidatorsValueHost, config: ValidatorConfigBase) =>
                new AsyncValidator(valueHost, config as AsyncValidatorConfig));
    }
    /**
     * Checks if a validator can be created based on the provided configuration.
     * @param config - The configuration for the validator.
     * @returns A boolean indicating whether the validator can be created.
     */
    public canCreate(config: ValidatorConfigBase): boolean
    {
        return config.validatorType == null || this.isRegistered(config.validatorType);
    }

    public create(valueHost: IValidatorsValueHost, config: ValidatorConfigBase): IValidator
    {
        if (config.validatorType == null)   // null or undefined
            return new Validator(valueHost, config as ValidatorConfig);
        const creatorFn = this._map.get(config.validatorType);
        if (creatorFn)
            return creatorFn(valueHost, config) as IValidator;
        throw new CodingError(`ValidationType not supported: ${ config.validatorType }`);
    }
    // user supplies JSON string or object implementing ValidatorConfig
    // and it returns an instance of IValidator.

    private readonly _map = new Map<string, ValidatorCreatorHandler>();

    /**
     * Add or replace a function to create an instance of the Validator
     * given a ValidatorConfig.
     * @param validatorType - Unique way to select the function. Uses ValidatorConfig.validatorType.
     * @param creatorFn - Expected to create an instance of a Validator.
     */
    public register(validatorType: ValidatorType | string,
        creatorFn: ValidatorCreatorHandler): void
    {
        this._map.set(validatorType, creatorFn);
    }

    /**
     * Utility to determine if a ValidatorType has been registered.
     * @param validatorType 
     * @returns 
     */
    public isRegistered(validatorType: ValidatorType | string): boolean
    {
        return this._map.get(validatorType) !== undefined;
    }

}

