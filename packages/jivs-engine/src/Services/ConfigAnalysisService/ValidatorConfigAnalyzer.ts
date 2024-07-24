/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import {
    ValidatorConfigResults, IValidatorConfigAnalyzer, IValidatorConfigPropertyAnalyzer,
    ConfigPropertyResult, ConfigIssueSeverity
} from "../../Interfaces/ConfigAnalysisService";
import { ValidatorConfig } from "../../Interfaces/Validator";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { cleanString } from "../../Utilities/Utilities";
import { AnalysisResultsHelper } from "./AnalysisResultsHelper";
import { ConfigAnalyzerBase } from "./ConfigAnalyzerBase";
import { IValidationServices } from '../../Interfaces/ValidationServices';

/**
 * Analyzes a ValidatorConfig object, with results in a ValidatorConfigResults object.
 * Determines the value of ValidatorConfigResults.errorCode before analyzing all properties.
 * Invalid errorcodes are shown as messages in that property.
 * Requires no duplicates of error codes amongst all ValidatorConfigResults objects.
 */
export class ValidatorConfigAnalyzer
    extends ConfigAnalyzerBase<ValidatorConfig, ValidatorConfigResults, IValidationServices>
    implements IValidatorConfigAnalyzer {

    constructor(helper: AnalysisResultsHelper<IValidationServices>,
        validatorConfigPropertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer>
    ) {
        super(helper, validatorConfigPropertyAnalyzers);
    }
    protected initResults(config: ValidatorConfig): ValidatorConfigResults {
        let vcResults: ValidatorConfigResults = {
            feature: 'Validator',
            errorCode: null!,   // will be assigned in resolveErrorCode
            config: config,
            properties: []
        };
        this.resolveErrorCode(config, vcResults);
        return vcResults;
    }


    /**
     * Sets the results.errorCode property based on the config.errorCode property
     * and other rules. Those rules may result in a warning or error message too.
     * 
     * Rules:
     * If null, undefined, or empty string, its value is the same as 
     * ValidatorConfig.conditionConfig.conditionType.
     * 
     * If conditionConfig is null, undefined, or has no conditionType, there
     * is no known error code and a warning is given if ValidatorConfig.conditionCreator
     * is also null or undefined. Info message is given if conditionCreator is supplied.
     * 
     * We don't try to invoke the conditionCreator to get the condition object with
     * its conditionType here. Leave that to the runtime tests.
     * The vhcResults.errorCode property is setup once all of that happens.
     * It gets "[Unknown at this time]" if conditionCreator is supplied
     * and "[Missing]" if conditionCreator is not supplied.
     * 
     * Finally, the error code is syntax checked. It must not contain any strings
     * and must have a min length of 1.
     * @param config - The ValidatorConfig object to analyze.
     * @param vcResults - The ValidatorConfigResults object to populate with analysis results.
     */
    protected resolveErrorCode(config: ValidatorConfig,
        vcResults: ValidatorConfigResults): void {
        let propResult: ConfigPropertyResult = {
            feature: 'Property',
            propertyName: 'errorCode',
            severity: undefined!,
            message: ''
        };
        // we'll only add propResult if severity is changed by the end of the function

        let valc = config;
        let resolvedErrorCode = cleanString(valc.errorCode);

        // check syntax which is disallows spaces
        if (resolvedErrorCode && /\s/.test(valc.errorCode!)) {
            // this error may get overwritten by other checks
            propResult.severity = ConfigIssueSeverity.error;
            propResult.message = 'Error code must not contain whitespace.';
        }        
        if (!resolvedErrorCode && valc.conditionConfig) {
            let ct = cleanString(valc.conditionConfig.conditionType);
            if (ct) {
                resolvedErrorCode = ct;
                propResult.severity = ConfigIssueSeverity.info;
                propResult.message = `Using the conditionType "${resolvedErrorCode}"`;
            }
        }
        if (!resolvedErrorCode)
            if (valc.conditionCreator) {
                resolvedErrorCode = '[Unknown at this time]';
                propResult.severity = ConfigIssueSeverity.warning;
                propResult.message = `conditionCreator is setup and will supply an error code when used.`;
            }
            else {
                resolvedErrorCode = '[Missing]';
                // checkForViability will add an error message
            }
        vcResults.errorCode = resolvedErrorCode;
        if (propResult.severity !== undefined)
            vcResults.properties.push(propResult);
    }

/**
 * Requirements for a valid ValidatorConfig object:
 * - Must supply an error code to the results.errorCode property.
 * - The validatorType property must be registered with the ValidatorFactory.
 * @param config 
 * @param results 
 * @returns 
 */
    protected checkForValiability(config: ValidatorConfig, results: ValidatorConfigResults): boolean {
        //NOTE: Depends on call to resolveErrorCode to set results.errorCode, which occurs in initResults

        if (results.errorCode === '[Missing]')
        {
            results.message = 'Must supply an error code.';
            results.severity = ConfigIssueSeverity.error;
        }
        if (!this.helper.services.validatorFactory.canCreate(config)) {
            results.message = 'The validatorType property is not valid. Register it with the ValidatorFactory.';
            results.severity = ConfigIssueSeverity.error;
        }
        return true;
    }

    /**
     * Duplicates are based on the resolved errorCode in ValidatorConfigResults.
     * If there is a duplicate, it is an error that gets reported
     * in the results.properties array.
     * 
     * Finally, the error code is syntax checked. It must not contain any strings
     * and must have a min length of 1.
     * @param config - The ValidatorConfig object to analyze.
     * @param results - The ValidatorConfigResults object to populate with analysis results.
     * @param existingResults - The existing ValidatorConfigResults objects to check for duplicates.
     */
    protected checkForDuplicates(config: ValidatorConfig, results: ValidatorConfigResults, existingResults: ValidatorConfigResults[]): void {
        if (results.errorCode[0] !== '[') {
            let lcEC = results.errorCode.toLowerCase().trim();
            if (existingResults.find(vr => (vr !== results) &&
                vr.errorCode.toLowerCase() === lcEC)) {
                let propResult: ConfigPropertyResult = {
                    feature: 'Property',
                    propertyName: 'errorCode',
                    severity: ConfigIssueSeverity.error,
                    message: `Duplicate error code "${results.errorCode}". All must be unique.`
                };
                results.properties.push(propResult);
            }
        }
    }

    /**
     * Sets the results.condition property based on the config.conditionConfig property
     * using the ConditionConfigAnalyzer.
     * @param config 
     * @param valueHostConfig 
     * @param results 
     */
    protected checkChildConfigs(config: ValidatorConfig, valueHostConfig: ValueHostConfig | null, results: ValidatorConfigResults): void {
        if (config.conditionConfig && this.helper.analysisArgs.conditionConfigAnalyzer) {
            results.condition = this.helper.analysisArgs.conditionConfigAnalyzer.analyze(config.conditionConfig, valueHostConfig, []);
        }
    }

}
