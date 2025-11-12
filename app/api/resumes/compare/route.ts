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

    const decoded = await verifyToken(token);
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
      prisma.resume.findUnique({ where: { id: parseInt(resumeId1) } }),
      prisma.resume.findUnique({ where: { id: parseInt(resumeId2) } }),
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
        fileName: resume1.fileName,
        score: resume1.score,
        summary: resume1.summary,
        data: resume1.data,
        version: resume1.version,
        createdAt: resume1.createdAt,
      },
      resume2: {
        id: resume2.id,
        fileName: resume2.fileName,
        score: resume2.score,
        summary: resume2.summary,
        data: resume2.data,
        version: resume2.version,
        createdAt: resume2.createdAt,
      },
      scoreDifference: resume2.score - resume1.score,
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
