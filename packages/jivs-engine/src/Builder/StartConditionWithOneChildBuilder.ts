/**
 *  @module Builder/ConditionBuilder
 */
import { ConditionConfig } from "../Interfaces/Conditions";
import { SetConfigOptions, IStartConditionWithOneChildBuilder } from "../Interfaces/ChildBuilders";
import { StartConditionBuilder } from "./StartConditionBuilder";

/**
 * Builder that allows only one child condition.
 * Used by Not and WhenConditions.
 */

export class StartConditionWithOneChildBuilder
    extends StartConditionBuilder
    implements IStartConditionWithOneChildBuilder {
    /**
     * Throws when the configuration already exists. Only allows the first attempt.
     * @param config
     * @param options
     */
    public setConfig(config: ConditionConfig, options?: SetConfigOptions): void {
        if (this.getConfig() != null)
            throw new Error('Only one child configuration permitted.');
        super.setConfig(config, options);
    }
}
