import { NextResponse } from 'next/server';
import { 
  calculateCalciumMetrics, 
  calculateSodiumMetrics, 
  compareChemicals,
  CalciumInput,
  SodiumInput
} from '@/lib/calculator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { calciumInput, sodiumInput } = body as { 
      calciumInput: CalciumInput; 
      sodiumInput: SodiumInput 
    };

    if (!calciumInput || !sodiumInput) {
      return NextResponse.json(
        { error: 'Missing inputs' },
        { status: 400 }
      );
    }

    const calciumMetrics = calculateCalciumMetrics(calciumInput);
    const sodiumMetrics = calculateSodiumMetrics(sodiumInput);
    const result = compareChemicals(calciumMetrics, sodiumMetrics);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
