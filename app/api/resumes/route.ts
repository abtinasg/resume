import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";

/**
 * GET /api/resumes
 * Fetch all resumes for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user's resumes ordered by most recent first
    const resumes = await prisma.resumeVersion.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
    });

    // Track dashboard view event
    await trackEvent('dashboard_viewed', {
      userId: user.userId,
      request: req,
      metadata: {
        resumeCount: resumes.length,
      },
    });

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json(
      { error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resumes
 * Create a new resume entry for the authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { fileName, score, summary, data } = body;

    // Validate required fields
    if (score === undefined && !summary && !data) {
      return NextResponse.json(
        { error: "At least one of score, summary, or data is required" },
        { status: 400 }
      );
    }

    const numericScore =
      score !== undefined && score !== null ? Number(score) : 0;

    const previousResume = await prisma.resumeVersion.findFirst({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
    });

    const resume = await prisma.resumeVersion.create({
      data: {
        userId: user.userId,
        name: fileName || "Untitled Resume",
        content: data ?? {},
        overallScore: Number.isFinite(numericScore) ? numericScore : 0,
        versionNumber: previousResume ? previousResume.versionNumber + 1 : 1,
      },
    });

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    console.error("Error creating resume:", error);
    return NextResponse.json(
      { error: "Failed to create resume entry" },
      { status: 500 }
    );
  }
}
