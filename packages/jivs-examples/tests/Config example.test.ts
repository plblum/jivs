import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import { UIPhase_Customize } from "../src/Config example";
import { ICalcValueHost } from "@plblum/jivs-engine/build/Interfaces/CalcValueHost";
import { IInputValueHost } from "@plblum/jivs-engine/build/Interfaces/InputValueHost";
import { IStaticValueHost } from "@plblum/jivs-engine/build/Interfaces/StaticValueHost";
import { CalcValueHost } from "@plblum/jivs-engine/build/ValueHosts/CalcValueHost";
import { InputValueHost } from "@plblum/jivs-engine/build/ValueHosts/InputValueHost";
import { StaticValueHost } from "@plblum/jivs-engine/build/ValueHosts/StaticValueHost";
import { Validator } from "@plblum/jivs-engine/build/Validation/Validator";
import { IValidationManager } from "@plblum/jivs-engine/build/Interfaces/ValidationManager";

function testVM(vm: IValidationManager): void
{
    expect(vm).not.toBeNull();
    let startDateVH: IInputValueHost | null = vm.getInputValueHost('StartDate');
    let endDateVH: IInputValueHost | null = vm.getInputValueHost('EndDate');
    let numOfDaysVH: IStaticValueHost | null = vm.getValueHost('NumOfDays');
    let diffDaysVH: ICalcValueHost | null = vm.getValueHost('DiffDays') as ICalcValueHost;

    expect(startDateVH).toBeInstanceOf(InputValueHost);
    expect(endDateVH).toBeInstanceOf(InputValueHost);
    expect(numOfDaysVH).toBeInstanceOf(StaticValueHost);
    expect(diffDaysVH).toBeInstanceOf(CalcValueHost);

    let startLessThanEnd = startDateVH!.getValidator(ConditionType.LessThan);
    let dateDiffLessThanNumOfDays = startDateVH!.getValidator('NumOfDays');
    expect(startLessThanEnd).toBeInstanceOf(Validator);
    expect(startLessThanEnd?.errorCode).toBe(ConditionType.LessThan);
    expect(startLessThanEnd?.conditionType).toBe(ConditionType.LessThan);
    expect(dateDiffLessThanNumOfDays).toBeInstanceOf(Validator);
    expect(dateDiffLessThanNumOfDays?.errorCode).toBe('NumOfDays');
    expect(dateDiffLessThanNumOfDays?.conditionType).toBe(ConditionType.LessThan);
}

describe('Using Config objects', () => {

    test('Confirm expecting ValueHosts and Validators exist', () => {
        let vm = UIPhase_Customize('objects');
        testVM(vm);
    });
});
describe('Using Fluent Syntax', () => {

    test('Confirm expecting ValueHosts and Validators exist', () => {
        let vm = UIPhase_Customize('fluent');
        testVM(vm);
    });
});