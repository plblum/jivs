/**
 * 
 * @module Services/ConcreteClasses/ConfigAnalysisService
 */

import { CAIssueSeverity, ConfigPropertyResult, IAnalysisResultsHelper, ValidatorConfigResults, propertyNameFeature } from "../../Interfaces/ConfigAnalysisService";
import { IValidationServices } from "../../Interfaces/ValidationServices";
import { ValidatorConfig } from "../../Interfaces/Validator";
import { ValueHostConfig } from "../../Interfaces/ValueHost";
import { ConfigPropertyAnalyzerBase } from "./ConfigPropertyAnalyzerBase";


/**
 * Instances created for each property or group of properties in a ValidatorConfig object
 * or subclass. They are registered with ValidatorConfigAnalyzer.register(). Built-in
 * classes are registered automatically. Custom classes are defined in the 
 * conditionConfigPropertyAnalyzers property of the ConfigAnalysisServiceOptions object.
 * 
 * The task is to update results.properties array with the results of the analysis if needed.
 * Create a ValidatorPropertyResult object if you have found an error or warning.
 * Optionally if you have an info level message. But don't add if the data is in good shape
 * and the user doesn't need additional instructions.
 */
export abstract class ValidatorConfigPropertyAnalyzerBase extends
    ConfigPropertyAnalyzerBase<ValidatorConfig, ValidatorConfigResults> {

}


/**
 * Represents a config property analyzer for these properties:
 * errorMessage, summaryMessage, errorMessagel10n, summaryMessagel10n.
 * 
 * It checks the tokens within messages and then checks the localizations against
 * the TextLocalizerService and all cultures registered.
 */
export class AllMessagePropertiesConfigPropertyAnalyzer extends ValidatorConfigPropertyAnalyzerBase {
    public analyze(config: ValidatorConfig, results: ValidatorConfigResults, valueHostConfig: ValueHostConfig,
        helper: IAnalysisResultsHelper<IValidationServices>): void {
        this.checkMessagePropertiesForTokens(config, results, valueHostConfig, helper);
        this.reviewErrorMessageLocalizations(config, results, helper);
    }

    /**
     * Checks the tokens related to these properties: 
     * errorMessage, summaryMessage, errorMessagel10n, summaryMessagel10n.
     * The l10n properties get their value from the TextLocalizerService first.
     * If a token is found, it is validated and the formatterKey
     * is added to the DataTypeFormatterLookupKeyAnalyzer.
     * If the token is not valid, an error is added to the validatorProperties array.
     * If there are no tokens, nothing is added.
    * @param vhcResults - The ValidatorConfigResults object to add the results to.
    * @param vhc - The ValueHostConfig object to use for the DataTypeFormatterLookupKeyAnalyzer.
     */
    protected checkMessagePropertiesForTokens(config: ValidatorConfig,
        vhcResults: ValidatorConfigResults, vhc: ValueHostConfig,
        helper: IAnalysisResultsHelper<IValidationServices>): void {

        let propResults = vhcResults.properties;
        helper.checkMessageTokens(config.errorMessage, config, vhc, 'errorMessage', propResults);
        helper.checkMessageTokens(config.summaryMessage, config, vhc,'summaryMessage', propResults);

        if (config.errorMessagel10n || config.summaryMessagel10n) {
            for (let cultureId of helper.results.cultureIds) {
                let localized = helper.services.textLocalizerService.localize(
                    cultureId, config.errorMessagel10n ?? null, null);
                if (localized)
                    helper.checkMessageTokens(localized, config, vhc, 'errorMessagel10n', propResults);
                localized = helper.services.textLocalizerService.localize(
                    cultureId, config.summaryMessagel10n ?? null, null);
                if (localized)
                    helper.checkMessageTokens(localized, config, vhc, 'summaryMessagel10n', propResults);
            }
        }
    }

    /**
     * Reviews the error message localizations for a given ValidatorConfigResults object.
     * It checks the errorMessagel10n and summaryMessagel10n properties for localization on
     * all cultures, adding the results to the properties array in a LocalizedPropertyResult object.
     * That result will host any errors found, such as lacking data in the TextLocalizerService.
     * If the errorMessage or summaryMessage is a function, it is ignored.
     * @param vhcResults - The ValidatorConfigResults object containing the validator 
     * configuration and property results.
     */
    protected reviewErrorMessageLocalizations(config: ValidatorConfig,
        vhcResults: ValidatorConfigResults,
        helper: IAnalysisResultsHelper<IValidationServices>): void {
        function checkForOneProperty(propertyName: string, l10nValue: string | null | undefined,
            fallbackValue: any
        )
        {
            let em: string | null | undefined = '';
            if (typeof fallbackValue === 'function') {
                propResults.push({
                    feature: propertyNameFeature,
                    propertyName: propertyName,
                    severity: CAIssueSeverity.info,
                    message: `The ${propertyName} property is a function. It will not be analyzed.`
                });
            }
            else
                em = fallbackValue;
            helper.checkLocalization(propertyName, l10nValue, em, propResults);
        }

        let propResults = vhcResults.properties;
        checkForOneProperty('errorMessage', config.errorMessagel10n, config.errorMessage);
        checkForOneProperty('summaryMessage', config.summaryMessagel10n, config.summaryMessage);
    }

}

/**
 * Represents a config property analyzer for the conditionCreator property on ValidatorConfig.
 * If validatorConfig.conditionCreator is supplied, confirm it is a function or its an error.
 * Confirm that conditionConfig is not also assigned, or its an error.
 */
export class ConditionCreatorConfigPropertyAnalyzer extends ValidatorConfigPropertyAnalyzerBase {
    public analyze(config: ValidatorConfig, results: ValidatorConfigResults, valueHostConfig: ValueHostConfig,
        helper: IAnalysisResultsHelper<IValidationServices>): void {
        let propResult: ConfigPropertyResult = {
            feature: propertyNameFeature,
            propertyName: 'conditionCreator',
            severity: undefined!,
            message: ''
        };
        if (config.conditionCreator) {
            if (typeof config.conditionCreator !== 'function') {
                propResult.severity = CAIssueSeverity.error;
                propResult.message = 'Must be a function.';
            }
            else if (config.conditionConfig) {
                propResult.severity = CAIssueSeverity.error;
                propResult.message = 'Cannot supply both conditionCreator and conditionConfig.';
            }
        }

        if (propResult.severity !== undefined)
            results.properties.push(propResult);
    }

}