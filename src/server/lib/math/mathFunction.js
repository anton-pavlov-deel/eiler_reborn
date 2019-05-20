import { Parser } from 'expr-eval';

const DEFAULT_DELTA = 0.000000004;

class MathFunction {
  constructor (expressionString) {
    const parser = new Parser();
    this._parsedFunction = parser.parse(expressionString);
  }

  evaluate (params) {
    return this._parsedFunction.evaluate(params);
  }

  derivativeBy (variable, dot = { x: 0, y: 0 }) {
    const funValue = this.evaluate(dot);
    const funChanges = this.evaluate({
      ...dot,
      [variable]: dot[variable] + DEFAULT_DELTA,
    });

    return (funChanges - funValue)/DEFAULT_DELTA;
  }
}

export default MathFunction;
