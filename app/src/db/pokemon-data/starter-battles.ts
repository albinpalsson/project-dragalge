import { STARTER_CHOICES } from '../../utils/starter-choices';

export type NemonaBattleNumber =
    | 'Second'
    | 'Third'
    | 'Fourth'
    | 'Fifth'
    | 'Final';

export function getNemonaBattleName(
    starterName: string,
    battleNumber: NemonaBattleNumber,
): string {
    if (!STARTER_CHOICES.some((choice) => choice.name === starterName)) {
        throw Error(`No Nemona battle found for ${starterName}`);
    }
    return `Nemona (${battleNumber} Battle - ${starterName})`;
}
