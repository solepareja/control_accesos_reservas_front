/**
 * Valida un número de DNI o NIE español calculando su letra de control (módulo 23).
 * Tabla oficial: TRWAGMYFPDXBNJZSQVHLCKE
 * Para NIE: X se sustituye por 0, Y por 1, Z por 2.
 * 
 * @param {string} valor - DNI o NIE a validar
 * @returns {{ valido: boolean, error?: string, dniFormateado?: string, letraEsperada?: string }}
 */
export function validarDniNie(valor) {
  if (!valor || typeof valor !== 'string') {
    return {
      valido: false,
      error: 'El DNI es obligatorio.',
    };
  }

  const limpio = valor.trim().toUpperCase().replace(/[\s-]/g, '');

  if (limpio.length === 0) {
    return {
      valido: false,
      error: 'El DNI es obligatorio.',
    };
  }

  // Patrón DNI (8 dígitos + letra o 7 dígitos con cero omitido + letra) o NIE (X, Y, Z + 7 dígitos + letra)
  const regex = /^([0-9]{7,8}|[XYZ][0-9]{7})([A-Z])$/;
  const match = limpio.match(regex);

  if (!match) {
    return {
      valido: false,
      error: 'El DNI introducido no es correcto. Debe contener 8 números (o letra NIE) seguidos de la letra de control (ej. 12345678Z).',
    };
  }

  let [, numeroParte, letraControl] = match;

  // Si tiene 7 dígitos numéricos, rellenar con un 0 a la izquierda
  if (numeroParte.length === 7 && /^[0-9]+$/.test(numeroParte)) {
    numeroParte = '0' + numeroParte;
  }

  // Cálculo para NIE
  let numeroParaCalculo = numeroParte;
  if (numeroParaCalculo.startsWith('X')) {
    numeroParaCalculo = '0' + numeroParaCalculo.slice(1);
  } else if (numeroParaCalculo.startsWith('Y')) {
    numeroParaCalculo = '1' + numeroParaCalculo.slice(1);
  } else if (numeroParaCalculo.startsWith('Z')) {
    numeroParaCalculo = '2' + numeroParaCalculo.slice(1);
  }

  const tablaLetras = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const numeroInt = parseInt(numeroParaCalculo, 10);

  if (isNaN(numeroInt)) {
    return {
      valido: false,
      error: 'El DNI introducido no es correcto. La parte numérica no es válida.',
    };
  }

  const indice = numeroInt % 23;
  const letraEsperada = tablaLetras.charAt(indice);

  if (letraControl !== letraEsperada) {
    return {
      valido: false,
      letraEsperada,
      error: `El DNI introducido no es correcto. La letra para el número ${numeroParte} no coincide (debería ser la '${letraEsperada}').`,
    };
  }

  return {
    valido: true,
    dniFormateado: `${numeroParte}${letraControl}`,
  };
}
