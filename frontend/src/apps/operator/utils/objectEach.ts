export function objectEach<T>(input: T, callback: (input: T, inputKey: keyof T) => void) {
  if (typeof input !== 'object' || !input) {
    return;
  }

  for (const key of Object.keys(input)) {
    const item = input[key as keyof T];

    callback(input, key as keyof T);

    if (typeof item === 'object') {
      objectEach(item as unknown as T, callback);
    }
  }
}
