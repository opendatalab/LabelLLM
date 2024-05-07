import type { IMatche } from '@/apps/supplier/services/task';
import { ECheckGrammarType } from '@/apps/supplier/services/task';

export const addSpanTags = (text: string, matches: IMatche[]) => {
  let result = text;
  matches.forEach(({ offset, length, shortMessage, message, type }) => {
    const prefix = result.substring(0, offset);
    const word = result.substring(offset, offset + length);
    const suffix = result.substring(offset + length);
    const prompt = `
<span class="child bg-white hidden shadow-md p-2 z-10 fixed top-full leading-tight rounded w-[200px]">
  <span class="w-full h-full font-bold mb-4">${shortMessage}</span>
  <br />
  <span class="block mt-2">${message}</span>
</span>
    `;
    const switchSpan =
      type.typeName === ECheckGrammarType.UnknownWord
        ? `<span class="check-word underline decoration-wavy relative cursor-pointer decoration-red-500 hover:bg-red-100">${word}${prompt}</span>`
        : `<span class="check-word underline decoration-wavy relative cursor-pointer decoration-yellow-500 hover:bg-yellow-100">${word}${prompt}</span>`;
    result = `${prefix}${switchSpan}${suffix}`;
  });

  return result;
};
