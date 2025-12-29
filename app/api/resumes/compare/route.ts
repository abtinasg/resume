import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { resumeId1, resumeId2 } = await request.json();

    if (!resumeId1 || !resumeId2) {
      return NextResponse.json(
        { error: 'Both resume IDs are required' },
        { status: 400 }
      );
    }

    // Fetch both resumes
    const [resume1, resume2] = await Promise.all([
      prisma.resumeVersion.findUnique({ where: { id: resumeId1 } }),
      prisma.resumeVersion.findUnique({ where: { id: resumeId2 } }),
    ]);

    if (!resume1 || !resume2) {
      return NextResponse.json(
        { error: 'One or both resumes not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (resume1.userId !== decoded.userId || resume2.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized to access these resumes' },
        { status: 403 }
      );
    }

    // Extract comparison data
    const comparison = {
      resume1: {
        id: resume1.id,
        fileName: resume1.name,
        score: resume1.overallScore,
        data: resume1.content,
        version: resume1.versionNumber,
        createdAt: resume1.createdAt,
      },
      resume2: {
        id: resume2.id,
        fileName: resume2.name,
        score: resume2.overallScore,
        data: resume2.content,
        version: resume2.versionNumber,
        createdAt: resume2.createdAt,
      },
      scoreDifference: (resume2.overallScore || 0) - (resume1.overallScore || 0),
    };

    return NextResponse.json({ comparison });
  } catch (error) {
    console.error('Error comparing resumes:', error);
    return NextResponse.json(
      { error: 'Failed to compare resumes' },
      { status: 500 }
    );
  }
}
