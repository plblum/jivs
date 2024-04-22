/**
 * @link ValueHostsBuilder:class
 * @module ValidationManager/ConcreteClasses/ValueHostsBuilder
 */

import { ValueHostName } from "../DataTypes/BasicTypes";
import { ValidatorConfig } from "../Interfaces/Validator";
import { ValidationManagerConfig } from "../Interfaces/ValidationManager";
import { ValueHostConfig } from "../Interfaces/ValueHost";
import { CodingError, assertNotNull } from "../Utilities/ErrorHandling";
import { FluentConditionCollector, FluentInputParameters, FluentInputValueConfig, FluentNonInputParameters, FluentValidatorCollector, StartFluent } from "./Fluent";
import { InputValueHostConfig } from "../Interfaces/InputValueHost";
import { NonInputValueHostConfig } from "../Interfaces/NonInputValueHost";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { CalcValueHostConfig, CalculationHandler } from "../Interfaces/CalcValueHost";
import { EvaluateChildConditionResultsConfig } from "../Conditions/EvaluateChildConditionResultsBase";
import { resolveErrorCode } from "./Validator";


/**
 * Access point for using ValueHostsBuilder. It wraps an instance of ValueHostBuilder
 * and lets you start using its functions, which are often chained.
 * @returns 
 */
export function build(vmConfig: ValidationManagerConfig): ValueHostsBuilder
{
    assertNotNull(vmConfig, 'vmConfig');
    return new ValueHostsBuilder(vmConfig);
}

/**
 * Assist the UI developer as they prepare ValidationManagerConfig.
 * 
 * It handles several use cases:
 * 1. Override the ValueHostConfigs already setup by Business logic,
 *    but only impacting the UI oriented values, like error message and label.
 * 
 * 2. When the UI wants to fully construct the ValueHostConfigs, it provides
 *    a fluent syntax to create each type of ValueHostConfig including any child Configs.
 * 
 * 3. When the business logic has provided its content, often the UI
 *    still has its own ValueHosts and validators to add. The developer
 *    can use the fluent syntax to add those ValueHosts and supporting
 *    functions to add the validators.
 * 
 * When starting with Business Logic:
 * 
 *      [UI creates the vmConfig including the services] ->
 * 
 *      [Business logic populates vmConfig.valueHostConfig] ->
 * 
 *      [With the Builder, UI replaces error messages and labels] ->
 * 
 *      [With the Builder, UI adds additional ValueHosts and validators]
 * 
 *      let vm = new ValidationManager(vmConfig);
 * 
 * When UI creates everything:
 * 
 *      [UI creates the vmConfig including the services] ->
 * 
 *      [With the Builder, UI creates all ValueHosts and validators, including the desired error messages and lables ] ->
 * 
 *      let vm = new ValidationManager(vmConfig);
 */
export class ValueHostsBuilder
{
/**
 * If the business logic provides ValueHostConfigs, they should already
 * be assigned to vmConfig.valueHostsConfig, and the developer
 * will be modifying those configs and adding their own.
 * If the UI is going to create all ValueHostConfigs, vmConfig.valueHostsConfig
 * can be null or []. The user will use the input(), nonInput(), and calc() functions
 * to populate it.
 * @param vmConfig - Expects services to be defined, as it uses the LoggingService
 * and TextLocalizationService.
 */
    constructor(vmConfig: ValidationManagerConfig)
    {
        assertNotNull(vmConfig, 'vmConfig');
        assertNotNull(vmConfig.services, 'vmConfig.services');
        this._vmConfig = vmConfig;
        if (vmConfig.valueHostConfigs == null)  // null or undefined
            vmConfig.valueHostConfigs = [];
    }
    private _vmConfig: ValidationManagerConfig;

    protected get vmConfig(): ValidationManagerConfig
    {
        return this._vmConfig;
    }

    //#region fluent for creating ValueHosts
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     * @returns FluentValidatorCollector for chaining validators to initial InputValueHost
     */
    public input(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector;
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire InputValueHostConfig. This is a special use case.
     * You can omit the type property.
     * @returns FluentValidatorCollector for chaining validators to initial InputValueHost
     */
    public input(config: FluentInputValueConfig): FluentValidatorCollector;
    // overload resolution
    public input(arg1: ValueHostName | FluentInputValueConfig, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector
    {
        let fluent = new StartFluent(this.vmConfig);
      
        if (typeof arg1 === 'object') {
            let collector = fluent.input(arg1);
            this.vmConfig.valueHostConfigs.push(collector.parentConfig);
            return collector;
        }
        if (typeof arg1 === 'string') {
            let collector = fluent.input(arg1, dataType, parameters);
            this.vmConfig.valueHostConfigs.push(collector.parentConfig);
            return collector;
        }
        throw new TypeError('Must pass valuehost name or InputValueHostConfig');
    }    
    /**
     * Fluent format to create a NonInputValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a NonInputValueHostConfig.
     * @returns Same instance for chaining.
     */
    nonInput(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentNonInputParameters): ValueHostsBuilder;
    /**
     * Fluent format to create a NonInputValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire NonInputValueHostConfig. This is a special use case.
     * You can omit the type property.
     * @returns Same instance for chaining.
     */
    nonInput(config: Omit<NonInputValueHostConfig, 'type'>): ValueHostsBuilder;
    // overload resolution
    nonInput(arg1: ValueHostName | NonInputValueHostConfig, dataType?: string | null, parameters?: FluentNonInputParameters): ValueHostsBuilder
    {
        let fluent = new StartFluent(this.vmConfig);
      
        if (typeof arg1 === 'object') {
            let vhConfig = fluent.nonInput(arg1);
            this.vmConfig.valueHostConfigs.push(vhConfig);
            return this;
        }
        if (typeof arg1 === 'string') {
            let vhConfig = fluent.nonInput(arg1, dataType, parameters);
            this.vmConfig.valueHostConfigs.push(vhConfig);
            return this;
        }
        throw new TypeError('Must pass valuehost name or InputValueHostConfig');        
    }
    /**
     * Start of a series to collect ConditionConfigs into any condition that
     * implements EvaluateChildConditionResultsConfig.
     * For example, fluent().input('Field1').all(fluent().conditions().required('Field2').required('Field3'))
     * The fluent function for all (and others that support EvaluateChildConditionResultsConfig)
     * will get a FluentConditionCollector whose conditionConfigs collection is fully populated.
    * @param parentConfig - When null/undefined, the instance is created and the caller is expected
    * to retrieve its conditionConfigs from the config property.
    * When assigned, that instance gets conditionConfigs populated and 
    * there is no need to get a value from configs property.
     * @returns a FluentConditionCollector for chaining conditions.
    */
    public conditions(parentConfig?: EvaluateChildConditionResultsConfig): FluentConditionCollector
    {
        let fluent = new StartFluent(this.vmConfig);
        return fluent.conditions(parentConfig);
    }    

    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - can be null. The value for ValueHost.dataType.
     * @param calcFn - required. Function callback.
     * @returns Same instance for chaining.
     */
    calc(valueHostName: ValueHostName, dataType: string | null, calcFn: CalculationHandler): ValueHostsBuilder;
    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire CalcValueHostConfig. This is a special use case.
     * You can omit the type property.
     * @returns Same instance for chaining.
     */
    calc(config: Omit<CalcValueHostConfig, 'type'>): ValueHostsBuilder;
    // overload resolution
    calc(arg1: ValueHostName | CalcValueHostConfig, dataType?: string | null, calcFn?: CalculationHandler): ValueHostsBuilder
    {
        let fluent = new StartFluent(this.vmConfig);
      
        if (typeof arg1 === 'object') {
            let vhConfig = fluent.calc(arg1);
            this.vmConfig.valueHostConfigs.push(vhConfig);
            return this;
        }
        if (typeof arg1 === 'string') {
            let vhConfig = fluent.calc(arg1, dataType ?? null, calcFn!);
            this.vmConfig.valueHostConfigs.push(vhConfig);
            return this;
        }
        throw new TypeError('Must pass valuehost name or InputValueHostConfig'); 
    }    

    //#endregion fluent for creating ValueHosts
    
    /**
     * Replace any of the InputValueHostConfig properties supported by UI.
     * Not supported: 'type', 'name', 'validatorConfigs'
     * @param valueHostName 
     * @param propsToUpdate 
     * @returns Same instance for chaining.
     */
    public updateInput(valueHostName: string, propsToUpdate: Partial<Omit<InputValueHostConfig, 'type' | 'name' | 'validatorConfigs'>>): ValueHostsBuilder
    {
        assertNotNull(propsToUpdate, 'propsToUpdate');        
        let vhConfig = this.getValueHostConfig(valueHostName, true);
        this.assertValueHostType(vhConfig, ValueHostType.Input);
        for (let propName in propsToUpdate)
            if (!['type', 'name', 'validatorConfigs'].includes(propName))
                (vhConfig as any)[propName] = (propsToUpdate as any)[propName];
        return this;
    }

    /**
     * Replace any of the NonInputValueHostConfig properties supported by UI.
     * Not supported: 'type', 'name'
     * @param valueHostName 
     * @param propsToUpdate 
     * @returns Same instance for chaining.
     */
    public updateNonInput(valueHostName: string, propsToUpdate: Partial<Omit<NonInputValueHostConfig, 'type' | 'name' >>): ValueHostsBuilder
    {
        assertNotNull(propsToUpdate, 'propsToUpdate');        
        let vhConfig = this.getValueHostConfig(valueHostName, true);
        this.assertValueHostType(vhConfig, ValueHostType.NonInput);
        for (let propName in propsToUpdate)
            if (!['type', 'name'].includes(propName))
                (vhConfig as any)[propName] = (propsToUpdate as any)[propName];

        return this;
    }

    /**
     * Replace any of the ValidatorConfig properties supported by UI (most are).
     * Not supported (in the domain of the business logic): 'errorCode', 'conditionConfig', 'conditionCreator'
     * @param valueHostName 
     * @param errorCode
     * @param propsToUpdate 
     * @returns Same instance for chaining.
     */    
    public updateValidator(valueHostName: ValueHostName, errorCode: string, propsToUpdate: Partial<Omit<ValidatorConfig, 'type' | 'conditionConfig' | 'conditionCreator' | 'errorCode'>>): ValueHostsBuilder
    {
        assertNotNull(propsToUpdate, 'propsToUpdate');
        let ivConfig = this.getValidatorConfig(valueHostName, errorCode, true);
        if (ivConfig)
        {
            for (let propName in propsToUpdate)
                if (!['type', 'conditionConfig', 'conditionCreator', 'errorCode'].includes(propName))
                    (ivConfig as any)[propName] = (propsToUpdate as any)[propName];
        }
        return this;
    }    

    protected assertValueHostType(valueHostConfig: ValueHostConfig | null, expectedType: ValueHostType): void
    {
        assertNotNull(valueHostConfig, 'valueHostConfig');
        if (valueHostConfig!.type !== expectedType)
            throw new CodingError(`ValueHost name ${valueHostConfig!.name ?? 'Unknown'} is not type=${expectedType}.`);

    }

    /**
     * Add one or more validators to valueHostName using fluent syntax.
     * 
     * `build(vmConfig).addValidators('Field1').requireText().regExp('expression');`
     * @param valueHostName 
     * @returns 
     */
    public addValidatorsTo(valueHostName: ValueHostName): FluentValidatorCollector {
        assertNotNull(valueHostName, 'valueHostName');  
        let vhConfig = this.getValueHostConfig(valueHostName, true);
        this.assertValueHostType(vhConfig, ValueHostType.Input);
        let collector = new FluentValidatorCollector(vhConfig as InputValueHostConfig);
        return collector;
    }

    /**
     * When the business logic provides the initial validators,
     * they include error messages designed from the business logic
     * perspective.
     * The UI layer can override them in several ways:
     * 1. Replacing them directly using updateValidator during configuratoin.
     * 2. Replacing them directly once ValidationManager exists, using
     *    InputValueHost.getValidator().setErrorMessage()
     * 3. By using those registered with TextLocalizationService.
     *    To use them, there should not be any error message already
     *    supplied to the validator and business layer messages get in the way.
     * This function should be called prior to creating ValidationManager
     * to remove all error messages supplied by business logic,
     * so long as they are covered in TextLocalizationServices.
     * Be sure that TextLocalizationServices is setup as desired
     * before calling this.
     */
    public favorUIMessages(): void
    {
        let tls = this._vmConfig.services.textLocalizerService;
        // goes through all validators
        // For any with an error message, see if it exists
        // in TextLocalizationService as "*". If so, clear
        // errorMessage, errorMessagel10n, summaryMessage, summaryMessagel10n
        // This allows TextLocalizationService to supply messages.
        for (let i = 0; i < this._vmConfig.valueHostConfigs.length; i++)
        {
            let vhConfig = this._vmConfig.valueHostConfigs[i] as InputValueHostConfig;
            if (vhConfig.validatorConfigs)
                vhConfig.validatorConfigs.forEach((ivConfig) => {
                    if (ivConfig.errorMessage || ivConfig.errorMessagel10n)
                        if (tls.getErrorMessage('*', resolveErrorCode(ivConfig), null))
                        {
                            delete ivConfig.errorMessage;
                            delete ivConfig.errorMessagel10n;
                            delete ivConfig.summaryMessage;
                            delete ivConfig.summaryMessagel10n;
                        }
                });
        }
    }


/**
 * Gets any ValueHostConfig type based on the valueHostName.
 * Note: Not public to discourage working around defenses that disallow changing
 * certain properties.
 * @param valueHostName 
 * @returns 
 */    
    protected getValueHostConfig(valueHostName: ValueHostName, throwWhenNotFound: boolean): ValueHostConfig | null
    {
        let result = this.vmConfig.valueHostConfigs.find((item) => item.name === valueHostName) ?? null;
        if (!result && throwWhenNotFound)
            throw new CodingError(`ValueHostName ${valueHostName} is not defined.`);      
        return result;
    }

/**
 * Gets ValidatorConfig based on the valueHostName and errorCode pair.
 * Note: Not public to discourage working around defenses that disallow changing
 * certain properties.
 * @param valueHostName 
 * @param errorCode
 * @returns 
 */        
    protected getValidatorConfig(valueHostName: ValueHostName, errorCode: string, throwWhenNotFound: boolean): ValidatorConfig | null
    {
        let vhConfig = this.getValueHostConfig(valueHostName, true);
        if (vhConfig && (vhConfig as InputValueHostConfig).validatorConfigs) { 
            let result = (vhConfig as InputValueHostConfig).validatorConfigs?.find((ivConfig) => {
                return resolveErrorCode(ivConfig) === errorCode;
            }) ?? null;
            if (!result && throwWhenNotFound)
                throw new CodingError(`ValueHostName ${valueHostName} with errorCode ${errorCode} is not defined.`);      
            return result;
        }
        return null;
    }
}
