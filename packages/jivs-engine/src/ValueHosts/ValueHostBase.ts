/**
 * {@inheritDoc jivs-engine/ValueHosts/Types/ValueHost }
 * @module jivs-engine/ValueHosts/AbstractClasses/ValueHostBase
 */
import { ValueHostName as valueHostName } from '../DataTypes/BasicTypes';
import { ConditionEvaluateResult, ICondition } from '../Interfaces/Conditions';
import { toIDisposable } from '../Interfaces/General_Purpose';
import { LoggingLevel } from '../Interfaces/LoggerService';
import type { IValidationManager } from '../Interfaces/ValidationManager';
import type { IJivsServices } from '../Interfaces/JivsServices';
import { type IValueHost, type SetValueOptions, type ValueHostConfig, type ValueHostInstanceState, toIValueHostCallbacks, ValidTypesForInstanceStateStorage } from '../Interfaces/ValueHost';
import { IValueHostGenerator } from '../Interfaces/ValueHostFactory';
import { assertNotNull, assertWeakRefExists, ensureError } from '../Utilities/ErrorHandling';
import { LoggerFacade } from '../Utilities/LoggerFacade';
import { deepClone, deepEquals } from '../Utilities/Utilities';

/**
 * Standard implementation of IValueHost
 */
export abstract class ValueHostBase<TConfig extends ValueHostConfig, TState extends ValueHostInstanceState>
    implements IValueHost {
    constructor(validationManager: IValidationManager, config: TConfig, state: TState) {
        assertNotNull(validationManager, 'validationManager');
        assertNotNull(config, 'config');
        assertNotNull(state, 'state');
        this._validationManager = new WeakRef<IValidationManager>(validationManager);
        this._config = config;
        this._instanceState = state;
    }
    //#region IValidationManagerAccessor
    public get validationManager(): IValidationManager {
        assertWeakRefExists(this._validationManager, 'ValueHostManager disposed');
        return this._validationManager.deref()!;
    }
    private readonly _validationManager: WeakRef<IValidationManager>;

    //#endregion IValidationManagerAccessor
    
    protected get services(): IJivsServices {
        return this.validationManager.services;
    }
    /**
     * Always supplied by constructor. Treat it as immutable.
     * Expected to be changed only by the caller (business logic)
     * and at that time, it must replace this instance with 
     * a new one and a new Config instance.
     */
    protected get config(): TConfig {
        return this._config;
    }
    private readonly _config: TConfig;

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void {
        toIDisposable(this._config)?.dispose();
        (this._config as any) = undefined;
        this._instanceState = undefined!;
        (this._validationManager as any) = undefined!;
        (this._logger as any) = undefined!;
    }

    /**
     * Provides an API for logging, sending entries to the loggerService.
     */
    protected get logger(): LoggerFacade
    {
        if (!this._logger)
            this._logger = new LoggerFacade(this.services.loggerService,
                'ValueHost', this, this.getName(), false);
        return this._logger;
    }
    private _logger: LoggerFacade | null = null;    


    //#region IValueHost
    /**
     * Provides a unique name for this ValueHost.
     * Consuming systems use this name to locate the ValueHost
     * for which they will transfer a value, via ValidationManager.getValueHost(this name)
     */
    public getName(): valueHostName {
        return this.config.name;
    }

    /**
     * A user friendly name for this ValueHost, to be shown in tooltips, error messages,
     * etc found in this ValueHostConfig that have the {Label} token.
     * Localization should occur when setting up the ValueHostConfig.
     */
    public getLabel(): string {
        const label = (this.config.label ?? '') as string;
        const labell10n: string | null = (this.config.labell10n ?? null) as string | null;
        if (labell10n)
            return this.services.textLocalizerService.localize(this.services.cultureService.activeCultureId, labell10n, label)!;
        return label;
    }

    /**
     * Gets the typed value in its native form,
     * ready for use by the caller without string conversion.
     * For example, a Date object or a number.
     * Returns undefined when the typed value could not be resolved
     * from the text value.
     */
    public getValue(): any {
        return this.instanceState.value;
    }

    /**
    * Replaces the typed value and optionally validates in subclasses
    * that implement IValidatableValueHostBase. 
    * Call when the typed value was changed directly by consuming code.
    * @param value - The typed value to store. Use undefined to indicate that the
    * typed value could not be resolved from the text value, such as when parsing fails.
    * All other values, including null and the empty string, are treated as real data.
    * When undefined, IsChanged is still set to true unless options.Reset = true.
    * @param options -
    *    * validate - Invoke validation after setting the value.
    *    * Reset - Clear validation state, unless validate = true, and set IsChanged to false.
    *    * ConversionErrorTokenValue - When value is undefined because parsing from text failed,
    *      provide a user-facing error message here. It will appear in the Category=Require
    *      validator within the {ConversionError} token.
    *    * SkipValueChangedCallback - Skips the automatic callback setup with the 
    *      OnValueChanged property.
    */
    public setValue(value: any, options?: SetValueOptions): void {
        this.logger.message(LoggingLevel.Debug, () => `setValue(${value})`);
        if (!options)
            options = {};
        if (!this.canChangeValueCheck(options))
            return;
        
        const oldValue: any = this.instanceState.value;   // even undefined is supported
        const changed = !deepEquals(value, oldValue);
        this.updateInstanceState((stateToUpdate) => {
            if (changed) {
                stateToUpdate.value = value;
            }
            this.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, changed, options!);
            return stateToUpdate;
        }, this);
        this.useOnValueChanged(changed, oldValue, options);
    }

    /**
     * For setValue functions to check for disabled before trying to change.
     */
    protected canChangeValueCheck(options: SetValueOptions): boolean {
        if (!options.overrideDisabled && !this.isEnabled()) {
            this.logger.message(LoggingLevel.Warn, () => `ValueHost "${this.getName()}" disabled. Value not changed`);
            return false;
        }
        if (options.overrideDisabled && !this.isEnabled()) {
            this.logger.message(LoggingLevel.Info, () =>`overrideDisabled option on ValueHost "${this.getName()}". Value changed`);
        }
        return true;
    }

    /**
     * Consuming system calls this when it attempts to resolve
     * the input field/element value but cannot. It identifies that the native value
     * is undefined.
     * Note this does not reset IsChanged to false without explicitly 
     * specifying options.Reset = true;
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Category=Require validator within the {ConversionError} token.
     */
    public setValueToUndefined(options?: SetValueOptions): void {
        this.setValue(undefined, options);
    }

    protected additionalInstanceStateUpdatesOnSetValue(stateToUpdate: TState, valueChanged: boolean, options: SetValueOptions): void {
        if (options.reset)
            stateToUpdate.changeCounter = 0;
        else if (valueChanged)
            stateToUpdate.changeCounter = (stateToUpdate.changeCounter ?? 0) + 1;
    }

    protected useOnValueChanged(changed: boolean, oldValue: any, options: SetValueOptions): void {
        if (changed && (!options || !options.skipValueChangedCallback))
            toIValueHostCallbacks(this.validationManager)?.onValueChanged?.(this, oldValue);
    }

    /**
     * A name of a data type used to lookup supporting services specific to the data type.
     * See the {@link jivs-engine/DataTypes/Types/LookupKey | LookupKey}. Some examples: "String", "Number", "Date", "DateTime", "MonthYear"
     */
    public getDataType(): string | null {
        return this.config.dataType ?? null;
    }
    /**
     * Provides a localized name for the data type when it needs to be shown to the user.
     * Since the ValueHostConfig.dataType is optional, this will end up returning the empty string,
     * unless the native value has been assigned and the DataTypeIdentifierService can figure out its lookupKey.
     */
    public getDataTypeLabel(): string {
        let dt = this.getDataType();
        if (!dt) {
            const value = this.getValue();
            if (value != null) { // null or undefined
                dt = this.services.dataTypeIdentifierService.identify(value);
            }
        }
        return dt ? (this.services.textLocalizerService.getDataTypeLabel(this.services.cultureService.activeCultureId, dt)!) : '';
    }

    /**
     * Determines how the validation system sees the Value in terms of editing.
     * When true, it was changed. When false, it was not.
     * The setValue()/setTextValue()/setValues() functions are the only ones to change this flag.
     * They all set it to true automatically except set it to false when the option.Reset is true.
     * The ValueHost.validate() function may skip validation of an FieldValueHost when IsChanged is false,
     * depending on the options for validate. For example, calling validate immediately after loading
     * up the form, you want to avoid showing Category=Require validators. Those should appear only
     * if the user edits, or when the user attempts to submit.
     */
    public get isChanged(): boolean {
        return (this.instanceState.changeCounter ?? 0) > 0;
    }

    /**
     * Determines if the ValueHost is enabled for user interaction.
     * It is enabled unless you explicilty set it to false using
     * ValueHostConfig.initialEnabled : false, 
     * setup the EnablerCondition which determines when it is enabled,
     * or the ValueHost's own setEnabled() function.
     * 
     * When disabled, the data values of the ValueHost do not get changed
     * by setValue() and related functions. However, those functions offer the 
     * overrideDisabled option to force the change.
     * 
     * When disabled and the ValueHost have validators, all validation is 
     * disabled and its ValidationStatus reports ValidationState.Disabled.
     */
    public isEnabled(): boolean {
        if (this.instanceState.enabled === false)
            return false;

        const enabler = this.getEnablerCondition();
        if (enabler) {
            try {
                // NOTE: The result of the enabler does not change any state of the valueHost,
                // unlike setEnabled(false) which clears validation.
                const result = enabler.evaluate(this, this.validationManager);
                if (result === ConditionEvaluateResult.Match)
                    return true;
                if (result === ConditionEvaluateResult.NoMatch)
                    return false;
            }
            catch (e) {
                const err = ensureError(e);                
                this.logger.error(err);
                throw err;
            }
        }

        // enablerCondition takes precedence over instanceState.enabled except when enabled is explicitly set to true, which takes the highest precedence. 
        // This allows the enabler condition to disable the ValueHost, but not to enable it when it would otherwise be disabled by initialEnabled or instanceState.enabled.
        if (this.instanceState.enabled === true)
            return true;

        if (!this.config.enablerConfig && this.config.initialEnabled !== undefined)
            return this.config.initialEnabled;
        
        return true;
    }
    /**
     * 
     * @returns 
     */
    protected getEnablerCondition(): ICondition | null {
        if (this._enablerCondition === undefined)
            if (this.config.enablerConfig) {
                try {
                    this._enablerCondition = this.services.conditionFactory.create(this.config.enablerConfig!);
                }
                catch (e) {
                    const err = ensureError(e);                    
                    this.logger.error(err);
                    throw err;
                }
            }
            else
                this._enablerCondition = null;
        return this._enablerCondition;
    }
    private _enablerCondition: ICondition | null | undefined = undefined;

    /**
     * Sets the enabled state of the ValueHost.
     * When false, the ValueHost is disabled and setValue() and related functions
     * will not change the value. However, they offer the overrideDisabled option
     * to force the change.
     * When disabled and the ValueHost has validators, all validation is disabled
     * and its ValidationStatus reports ValidationState.Disabled.
     * 
     * This value is part of the ValueHost's InstanceState, not the Config,
     * although the ValueHostConfig.initialEnabled is used when it is not set in the state.
     * @param enabled 
     */
    public setEnabled(enabled: boolean): void {
        this.logger.message(LoggingLevel.Debug, () => `setEnabled(${enabled})`);        
        this.updateInstanceState((stateToUpdate) => {
            stateToUpdate.enabled = enabled;
            return stateToUpdate;
        }, this);
    }

    //#endregion IValueHost

    //#region State
    /* 
     * Current state for the associated ValueHost.
     * Only ValidationManager owns the state. This instance is a reference
     * to the value in ValidationManager.
     * InstanceState is considered immutable. If it needs to change,
     * the ValidationManager must discard the current ValueHost instance
     * and create a new one. The InstanceState contained in the ValidationManager
     * must be supplied to the new ValueHost instance to restore the state.
    */
    protected get instanceState(): TState {
        return this._instanceState;
    }
    private _instanceState: TState;

    /**
     * Use to change anything in ValueHostInstanceState without impacting the immutability 
     * of the current instance.
     * Your callback will be passed a cloned instance. Change any desired properties
     * and return that instance. It will become the new immutable value of
     * the InstanceState property.
     * If changes were made, the OnValueHostInstanceStateChanged event is fire.
     * @param updater 
     * @returns true when the state did change. false when it did not.
     */
    public updateInstanceState(updater: (stateToUpdate: TState) => TState,
        source: IValueHost): boolean {
        assertNotNull(updater, 'updater');
        const toUpdate = deepClone(this.instanceState);
        const updated = updater(toUpdate);
        if (!deepEquals(this.instanceState, updated)) {
            this._instanceState = updated;
            this.validationManager.notifyValueHostInstanceStateChanged(source, updated);
            return true;
        }
        return false;
    }

    /**
     * Adds a custom entry into the ValueHost's state
     * or removes it when value = undefined.
     * @param key 
     * @param value - when undefined, it removes the value from the state
     */
    public saveIntoInstanceState(key: string, value: ValidTypesForInstanceStateStorage | undefined): void {
        this.updateInstanceState((stateToUpdate) => {
            if (!stateToUpdate.items)
                stateToUpdate.items = {};
            if (value !== undefined)
                stateToUpdate.items[key] = value;
            else
                delete stateToUpdate.items[key];
            return stateToUpdate;
        }, this);

    }
    /**
     * Use to retrieve a value from the state that was stored
     * with saveIntoInstanceState().
     * @param key 
     * @returns the stored value or undefined if nothing is stored.
     */
    public getFromInstanceState(key: string): ValidTypesForInstanceStateStorage | undefined {
        return this.instanceState.items ? this.instanceState.items[key] : undefined;
    }
}


export abstract class ValueHostBaseGenerator implements IValueHostGenerator {
    public abstract canCreate(config: ValueHostConfig): boolean;

    public abstract create(validationManager: IValidationManager, config: ValueHostConfig, state: ValueHostInstanceState): IValueHost;

    /**
     * Looking for changes to the ValidationConfigs to impact IssuesFound.
     * If IssuesFound did change, fix ValidationStatus for when Invalid to 
     * review IssuesFound in case it is only a Warning, which makes ValidationStatus Valid.
     * @param state 
     * @param config 
     */
    public abstract cleanupInstanceState(state: ValueHostInstanceState, config: ValueHostConfig): void;
    public createInstanceState(config: ValueHostConfig): ValueHostInstanceState {
        return {
            name: config.name,
            value: config.initialValue
        };
    }

}