/**
 *  @module Builder/ConcreteClasses/StartConditionWithChildrenBuilder
*/

import { ConditionType } from "../Conditions/ConditionTypes";
import { ConditionWithChildrenBaseConfig } from "../Conditions/ConditionWithChildrenBase";
import { ConditionConfig } from "../Interfaces/Conditions";
import { assertNotNull } from "../Utilities/ErrorHandling";
import {
    IBuilderConfigHost, SetConfigOptions,
    IStartConditionWithChildrenBuilder
} from "../Interfaces/ChildBuilders";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { StartConditionBuilder } from "./StartConditionBuilder";

/**
 * Starter these conditions: AllCondition, AnyCondition, CountMatchesCondition.
 * These conditions have an array of child condition configs that are supplied through an array.
 * Each child in created by its own ConditionBuilder and passed up to this one.
 *
 * It works a bit differently than the usual, by taking on the task of creating
 * the actual ConditionWithChildrenBaseConfig object, and through setConfig(),
 * adding each child config to the array,
 * which is the conditionConfigs property of the ConditionWithChildrenBaseConfig.
 *
 * Each call to setConfig() will add a child config to the array.
 * It fully creates the ConditionWithChildrenBaseConfig object, which is returned by getConfig().
 *
 * It does not offer a completed callback to the parent builder because each
 * call to its setConfig() handles the addition of a child config,
 * and the parent builder will only receive the fully constructed configuration when appropriate.
 */

export class StartConditionWithChildrenBuilder
    extends StartConditionBuilder
    implements IStartConditionWithChildrenBuilder {

    constructor(services: IValidationServices,
        parentBuilder: IBuilderConfigHost<object>,
        conditionType: ConditionType
        /*completed?: CompleteConfigBuilderHandler<ConditionConfi>*/ 
    ) {
        super(services, parentBuilder /*, completed */);
        super.setConfig({
            conditionType: conditionType,
            conditionConfigs: []
        } as ConditionWithChildrenBaseConfig,
            { bubbleUp: false, applyValueHostName: false });
    }

    public setConfig(config: ConditionConfig, options?: SetConfigOptions): void {
        assertNotNull(config, "config");
        assertNotNull(config.conditionType, "config.conditionType");

        // child node may get handled a valuehostname
        let revise = !options || options.applyValueHostName != false;
        if (revise)
            this.reviseValueHostName(config);
        let configWithChildren = this.getConfig() as ConditionWithChildrenBaseConfig;
        configWithChildren?.conditionConfigs.push(config);
        // do not bubble up the changes to parent's completed handler because
        // we are still capturing. Its up to the parent builder to handle the completed configuration.
        /*
                // we are modifying the same object already in setConfig, so the
                // call here appears to have no effect on the actual object reference,
                // but it ensures that any parent builder is notified of the update.
                
                // don't apply current valuehostname to the parent config itself, only to the child configs
        
                super.setConfig(configWithChildren, { bubbleUp: false, applyValueHostName: false });
        
        */
    }
}
