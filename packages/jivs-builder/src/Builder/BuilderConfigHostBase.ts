/**
 *  @module Builder/ConcreteClasses
 */

import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggerService';
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { LoggerFacade } from '@plblum/jivs-engine/build/Utilities/LoggerFacade';
import { CompleteConfigBuilderHandler, IBuilderConfigHost, SetConfigOptions } from '../Interfaces/ChildBuilders';

/**
 * Base class for Builders that implement IBuilderConfigHost
 */
export abstract class BuilderConfigHostBase<TConfig extends object,
    TOptions extends SetConfigOptions = SetConfigOptions>
    implements IBuilderConfigHost<TConfig, TOptions>
{
    /**
     * 
     * @param services 
     * @param parentBuilder - expected to be null at the very top node.
     * @param completed 
     */
    constructor(services: IValidationServices,
        parentBuilder: IBuilderConfigHost<object> | null, // intentionally <object></object> because the parent might not be creating a condition config
        completed?: CompleteConfigBuilderHandler<TConfig>) {
        assertNotNull(services, 'services');
        this._services = services;
        this._parentBuilder = parentBuilder;
        this._completed = completed;
    }

    protected get services(): IValidationServices
    {
        return this._services;
    }
    private readonly _services: IValidationServices;

    protected get parentBuilder(): IBuilderConfigHost<object> | null {
        return this._parentBuilder;
    }
    private readonly _parentBuilder: IBuilderConfigHost<object> | null;

    /**
     * Supporting functions finish up by calling the setConfig method.
     * If this callback is assigned to the parent builder, setConfig will be called 
     * automatically when the child is completed
     * allowing it to hook up the child into its own config.
     * 
     * ```ts
     * public not(notBuilder: StartConditionBuilderHandler): void { ... }
     * {
     *      let notConfig: NotConditionConfig = {
     *          conditionType: ConditionType.Not,
     *          childConditionConfig: null! // pending the notBuilder results
     *      };
     *      let startBuilder = new StartConditionBuilder(this,
     *         (childConfig: ConditionConfig, source: IConditionBuilder) => 
     *             notConfig.childConditionConfig = childConfig;
     *         }
     *      );
     *      this.setConfig(notConfig);
     * }
     * public setConfig(config: ConditionConfig, options?: SetConfigOptions): void
     * {
     *      this._config = config;
     * // bubble up
     *      let bubbleUp = !options || options.bubbleUp != false;
     *      if (bubbleUp && this.parentBuilder?.completed) {
     *          this.parentBuilder.completed(config, this);
     *      }
     * }
     * ```
     */
    public get completed(): CompleteConfigBuilderHandler<TConfig> | undefined {
        return this._completed;
    }
    private readonly _completed?: CompleteConfigBuilderHandler<TConfig>;

    private _config?: TConfig;

    public setConfig(config: TConfig, options?: TOptions): void {
        assertNotNull(config, 'config');
        this._config = config;
        const bubbleUp = !options || options.bubbleUp != false;
        if (bubbleUp && this.parentBuilder?.completed) {
            this.parentBuilder.completed?.(config, this as IBuilderConfigHost<object>);
        }

    }

    public getConfig(): TConfig | undefined {
        return this._config;
    }    

    /**
     * Captures an error in the configuration and throws if the message is an Error object.
     * Always writes to the console and to the logger.
     * @param message - The error message or Error object to report. 
     * If it is an Error object, it will be thrown after reporting.
     */
    protected reportError(message: string | Error): void {
        const msg = message instanceof Error ? message.message : message;
        console.error(msg);
        this.logger.message(LoggingLevel.Error, ()=> msg);
        if (message instanceof Error) {
            throw message;
        }
    }
    protected get logger(): LoggerFacade {
        if (!this._logger) {
            this._logger = new LoggerFacade(this.services.loggerService,
            'ConfigBuilder', this, null, false);
        }
        return this._logger;
    }
    private _logger?: LoggerFacade;

}