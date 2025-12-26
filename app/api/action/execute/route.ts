import { NextRequest, NextResponse } from 'next/server';
import { Layer3 } from '@/lib/layers';

export async function POST(request: NextRequest) {
  try {
    const { actionType, payload } = await request.json();
    
    if (!actionType) {
      return NextResponse.json(
        { error: 'Missing actionType' },
        { status: 400 }
      );
    }
    
    // For MVP, only support improve_bullet
    if (actionType === 'improve_bullet') {
      const { bullet } = payload;
      
      if (!bullet) {
        return NextResponse.json(
          { error: 'Missing bullet text' },
          { status: 400 }
        );
      }
      
      const result = await Layer3.rewriteBullet({
        type: 'bullet',
        bullet,
        issues: ['weak_verb'],
        layer1: {
          extracted: { skills: [], tools: [] },
        },
      });
      
      return NextResponse.json({
        success: true,
        result: {
          improved: result.improved,
          original: result.original,
          validation_passed: result.validation.passed,
          evidence_map: result.evidence_map,
        },
      });
    }
    
    return NextResponse.json(
      { error: 'Unsupported action type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Action execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
