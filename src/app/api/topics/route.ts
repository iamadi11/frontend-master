import { NextResponse } from "next/server";
import { listCurriculumModules } from "@/lib/content";

export async function GET() {
  try {
    const modules = await listCurriculumModules();
    return NextResponse.json(modules);
  } catch (error) {
    console.error("Failed to fetch modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}
