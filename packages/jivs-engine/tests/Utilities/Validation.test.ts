import { ConditionType } from "../../src/Conditions/ConditionTypes";
import { ValidatorConfig } from "../../src/Interfaces/Validator";
import { resolveErrorCode } from "../../src/Utilities/Validation";

describe('resolveErrorCode', () => {

    it('should return the errorCode if it is defined in the ValidatorConfig', () => {
        const validatorConfig = {
            errorCode: 'CUSTOM_ERROR_CODE',
            conditionConfig: null
        };
        expect(resolveErrorCode(validatorConfig)).toEqual('CUSTOM_ERROR_CODE');
    });

    it('should return the ConditionType of the conditionConfig if errorCode is not defined', () => {
        const validatorConfig = {
            conditionConfig: {
                conditionType: 'SOME_CONDITION_TYPE'
            }
        };
        expect(resolveErrorCode(validatorConfig)).toEqual('SOME_CONDITION_TYPE');
    });

    it('should return the childConditionConfig\'s ConditionType for WhenCondition', () => {
        const validatorConfig = {
            conditionConfig: {
                conditionType: ConditionType.When,
                childConditionConfig: {
                    conditionType: 'CHILD_CONDITION_TYPE'
                }
            }
        };
        expect(resolveErrorCode(validatorConfig)).toEqual('CHILD_CONDITION_TYPE');
    });

    it('should return "Unknown" if neither errorCode nor conditionConfig are defined', () => {
        const validatorConfig = {} as ValidatorConfig;
        expect(resolveErrorCode(validatorConfig)).toEqual(ConditionType.Unknown);
    });

    it('should return "Unknown" if conditionConfig is defined without a conditionType', () => {
        const validatorConfig = {
            conditionConfig: {}
        } as ValidatorConfig;
        expect(resolveErrorCode(validatorConfig)).toEqual(ConditionType.Unknown);
    });
});
