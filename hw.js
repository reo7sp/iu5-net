function xorify(startValue, del) {
  let current = startValue;

  while (current.toString(2).length >= del.toString(2).length) {
    const bitsDiff = current.toString(2).length - del.toString(2).length;
    const xorFirst = current >> bitsDiff;
    const xorResult = xorFirst ^ del;

    current = (xorResult << bitsDiff) | (~(0b1 << (bitsDiff + 1)) & current);

    const firstPart = xorResult << bitsDiff;
    const secondPart = parseInt("1".repeat(bitsDiff), 2) & current;

    current = firstPart | secondPart;
  }

  return current;
}

function encode(toEncode, polynome, n, k) {
  let mx = toEncode << (n - k);
  let px = xorify(mx, polynome);

  return mx ^ px;
}

function decode(toDecode, polynome) {
  return xorify(toDecode, polynome);
}

function prepareSyndromToErr() {
  return {
    [0b0001]: 1,
    [0b0010]: 0b1 << 1,
    [0b0100]: 0b1 << 2,
    [0b1000]: 0b1 << 3,
    [0b0011]: 0b1 << 4,
    [0b0110]: 0b1 << 5,
    [0b1100]: 0b1 << 6,
    [0b1011]: 0b1 << 7,
    [0b0101]: 0b1 << 8,
    [0b1010]: 0b1 << 9,
    [0b0111]: 0b1 << 10,
    [0b1110]: 0b1 << 11,
    [0b1111]: 0b1 << 12,
    [0b1101]: 0b1 << 13,
    [0b1001]: 0b1 << 14
  };
}

function calculateInfo(informCode, polynome, N, K, syndromeToErr) {
  const encoded = encode(informCode, polynome, N, K);

  const checkCode = (o, t, e) => (o ^ t) === e;
  const findBitsCount = s => s.match(/1/g).length;

  return [...Array(2 ** N - 1)]
    .map((_, i) => (i + 1) >>> 0)
    .reduce(
      (info, simulatedErr) => {
        const trueBits = findBitsCount(simulatedErr.toString(2));

        const errorCode = encoded ^ simulatedErr;

        const syndrome = decode(errorCode, polynome);

        return {
          N: info.N,
          fixed: {
            ...info.fixed,
            ...(checkCode(
              errorCode,
              syndrome && syndromeToErr[syndrome],
              encoded
            )
              ? {
                  [trueBits]: (info.fixed[trueBits] || 0) + 1
                }
              : {})
          },
          errors: {
            ...info.errors,
            [trueBits]: (info.errors[trueBits] || 0) + 1
          }
        };
      },
      {
        N,
        fixed: {},
        errors: {}
      }
    );
}

function paintTable({ N, fixed, errors }) {
  console.log('i', '\t', 'C', '\t', 'Nk', '\t', 'Ck');
  [...Array(N)].forEach((_, i) =>
    console.log(i + 1, '\t', errors[i+1], '\t', fixed[i+1] || 0, '\t', (fixed[i + 1] || 0) / errors[i + 1])
  );
}

paintTable(calculateInfo(
  0b00001010011,
  0b10011,
  15,
  11,
  prepareSyndromToErr()
));
